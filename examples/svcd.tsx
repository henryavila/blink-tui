/**
 * svcd — blink's reference app.
 *
 * A fictional local-services manager that exercises every blink primitive at the
 * 100×30 design target: two panes, a focused-pane border recolour, a list with
 * state + domain glyphs, a live status bar, modal dialogs, a search field, and
 * the braille spinner. Keyboard only.
 *
 * Run it: `npm run example` (or `npx tsx examples/svcd.tsx`).
 * Keys: ↑↓/j k move · tab switch pane · / search · a apply · d delete · ? help · q reset
 */
import React, { useState } from 'react';
import { Writable } from 'node:stream';
import { render, Box, Text, useInput, useApp } from 'ink';
import {
  ThemeProvider,
  detectIconSet,
  Pane,
  List,
  Footer,
  Input,
  Dialog,
  Spinner,
  useTokens,
  useGlyph,
  useStdoutDimensions,
  useSpinnerFrame,
  spinnerFor,
  useIconSet,
  blocks,
  catppuccinMocha as ctp,
  type ListRowData,
} from '../src/index.js';

type ServiceState = 'ok' | 'err' | 'pending' | 'drift';

interface Service {
  id: string;
  domain: string; // glyph name
  domainColor: string;
  name: string;
  state: ServiceState;
  detail: string;
  port: number | null;
}

const SERVICES: Service[] = [
  { id: 'pg', domain: 'postgresql', domainColor: ctp.blue, name: 'postgres@14.10', state: 'ok', detail: 'data/pg/main', port: 5432 },
  { id: 'redis', domain: 'redis', domainColor: ctp.red, name: 'redis@7.2', state: 'ok', detail: '/var/redis', port: 6379 },
  { id: 'docker', domain: 'docker', domainColor: ctp.sky, name: 'docker', state: 'pending', detail: '28 containers · 4 stopped', port: null },
  { id: 'nginx', domain: 'ubuntu', domainColor: ctp.peach, name: 'nginx', state: 'drift', detail: 'config out-of-date', port: 80 },
  { id: 'node', domain: 'nodejs', domainColor: ctp.green, name: 'node · api', state: 'ok', detail: 'pid 4821 · :3000', port: 3000 },
  { id: 'graf', domain: 'database', domainColor: ctp.subtext1, name: 'grafana', state: 'err', detail: 'missing on host', port: 3001 },
  { id: 'ssh', domain: 'ssh', domainColor: ctp.yellow, name: 'ssh-agent', state: 'ok', detail: '3 keys loaded', port: null },
];

const STATE_GLYPH: Record<ServiceState, { name: string; tokenKey: 'stateOk' | 'stateErr' | 'statePending' | 'stateDrift'; word: string }> = {
  ok: { name: 'check', tokenKey: 'stateOk', word: 'running' },
  err: { name: 'cross', tokenKey: 'stateErr', word: 'missing' },
  pending: { name: 'circle', tokenKey: 'statePending', word: 'starting' },
  drift: { name: 'half', tokenKey: 'stateDrift', word: 'drift' },
};

type DialogKind = null | 'delete' | 'help' | 'error';

function App({ interactive = true }: { interactive?: boolean } = {}): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  const iconSet = useIconSet();
  const app = useApp();
  const { rows } = useStdoutDimensions();

  const [services, setServices] = useState<Service[]>(SERVICES);
  const [focusIdx, setFocusIdx] = useState(2);
  const [pane, setPane] = useState<'left' | 'right'>('left');
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [status, setStatus] = useState('ready');

  const frame = useSpinnerFrame({ active: syncing != null });
  const frames = spinnerFor(iconSet);
  const spin = frames[frame % frames.length] ?? frames[0]!;

  const filtered = services.filter(
    (s) => query === '' || s.name.toLowerCase().includes(query.toLowerCase()),
  );
  const safeIdx = Math.min(focusIdx, Math.max(0, filtered.length - 1));
  const current = filtered[safeIdx];

  useInput((input, key) => {
    if (searching) {
      if (key.escape) {
        setSearching(false);
        setQuery('');
      } else if (key.return) {
        setSearching(false);
      } else if (key.backspace || key.delete) {
        setQuery((q) => q.slice(0, -1));
      } else if (input) {
        setQuery((q) => q + input);
      }
      return;
    }
    if (dialog) {
      if (key.escape || input === 'n') setDialog(null);
      else if (dialog === 'delete' && input === 'y' && current) {
        const id = current.id;
        setServices((ss) => ss.filter((s) => s.id !== id));
        setDialog(null);
        setStatus('removed ' + current.name);
      } else if (dialog === 'help' && input === '?') setDialog(null);
      else if (dialog === 'error' && (key.return || input === 'l')) setDialog(null);
      return;
    }
    if (key.downArrow || input === 'j') setFocusIdx((i) => Math.min(i + 1, filtered.length - 1));
    else if (key.upArrow || input === 'k') setFocusIdx((i) => Math.max(i - 1, 0));
    else if (key.tab) setPane((p) => (p === 'left' ? 'right' : 'left'));
    else if (input === '/') {
      setSearching(true);
      setPane('left');
    } else if (input === 'a' && current) {
      if (current.state === 'err') setDialog('error');
      else {
        const id = current.id;
        setSyncing(id);
        setStatus('applying ' + current.name);
        setTimeout(() => {
          setServices((ss) =>
            ss.map((s) =>
              s.id === id ? { ...s, state: 'ok', detail: id === 'nginx' ? 'config in sync' : s.detail } : s,
            ),
          );
          setSyncing(null);
          setStatus('applied');
        }, 1600);
      }
    } else if (input === 'd' && current) setDialog('delete');
    else if (input === '?') setDialog('help');
    else if (input === 'q') {
      if (services.length === SERVICES.length) app.exit();
      else {
        setServices(SERVICES);
        setFocusIdx(2);
        setQuery('');
        setStatus('ready');
      }
    }
  }, { isActive: interactive });

  const counts = services.reduce<Record<string, number>>((a, s) => {
    a[s.state] = (a[s.state] ?? 0) + 1;
    return a;
  }, {});

  const rowsData: ListRowData[] = filtered.map((s) => {
    const sg = STATE_GLYPH[s.state];
    const isSyncing = syncing === s.id;
    return {
      id: s.id,
      domain: g(s.domain),
      domainColor: s.domainColor,
      glyph: isSyncing ? spin : g(sg.name),
      glyphColor: isSyncing ? t.stateInfo : t[sg.tokenKey],
      label: s.name,
      meta: isSyncing ? 'applying…' : s.detail,
    };
  });

  const footerKeys =
    dialog === 'help'
      ? [{ k: '?', desc: 'close help' }]
      : dialog
        ? [{ k: 'esc', desc: 'cancel' }, { k: 'y', desc: 'confirm' }, { k: 'n', desc: 'no' }]
        : searching
          ? [{ k: 'esc', desc: 'clear' }, { k: 'enter', desc: 'done' }]
          : [
              { k: 'tab', desc: 'pane' },
              { k: 'enter', desc: 'open' },
              { k: '/', desc: 'search' },
              { k: 'a', desc: 'apply' },
              { k: 'd', desc: 'delete' },
              { k: '?', desc: 'help' },
              { k: 'q', desc: 'quit' },
            ];

  const right = `${g('check')} ${counts.ok ?? 0}  ${g('circle')} ${counts.pending ?? 0}  ${g('half')} ${counts.drift ?? 0}  ${g('cross')} ${counts.err ?? 0}`;

  return (
    <Box flexDirection="column" height={rows}>
      {/* title bar */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Text color={t.fgInverse} backgroundColor={t.bgInverse}>
          {` ${blocks.cursor} svcd · built with blink `}
        </Text>
        <Text color={t.fgDim}>{syncing ? `${spin} ${status}` : status}</Text>
      </Box>

      {/* search field */}
      {searching ? (
        <Box paddingX={0}>
          <Input title="search" value={query} placeholder="type to filter services…" focused />
        </Box>
      ) : null}

      {/* body: dialog replaces the panes (Ink has no overlay) */}
      {dialog ? (
        <DialogLayer kind={dialog} current={current} />
      ) : (
        <Box flexDirection="row" flexGrow={1} minHeight={0}>
          <Pane title={`services (${filtered.length})`} focused={pane === 'left'} flexBasis="56%">
            <List rows={rowsData} focusedId={current ? current.id : null} />
          </Pane>
          <Pane title="detail" focused={pane === 'right'} flexBasis="44%">
            {current ? <Detail service={services.find((x) => x.id === current.id)!} /> : <Empty />}
          </Pane>
        </Box>
      )}

      <Footer keys={footerKeys} right={right} />
    </Box>
  );
}

function Detail({ service }: { service: Service }): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  const sg = STATE_GLYPH[service.state];
  return (
    <Box flexDirection="column">
      <Text>
        <Text color={service.domainColor}>{g(service.domain)}</Text>
        {'  '}
        <Text color={t.fg}>{service.name}</Text>
      </Text>
      <Text> </Text>
      <Row k="state" v={<Text color={t[sg.tokenKey]}>{`${g(sg.name)} ${sg.word}`}</Text>} />
      <Row k="path" v={<Text color={t.fg}>{service.detail}</Text>} />
      <Row k="port" v={<Text color={t.fg}>{service.port == null ? '—' : String(service.port)}</Text>} />
      <Text> </Text>
      <Text color={t.fgFaint}>{`${g('depends')} actions`}</Text>
      <Text color={t.fgDim}>
        {service.state === 'ok' ? `${g('rerun')} a  reapply (idempotent)` : `${g('bolt')} a  apply now`}
      </Text>
      <Text color={t.fgDim}>{`${g('cross')} d  remove`}</Text>
    </Box>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }): React.ReactElement {
  const t = useTokens();
  return (
    <Box flexDirection="row">
      <Box width={8} flexShrink={0}>
        <Text color={t.fgFaint}>{k}</Text>
      </Box>
      {v}
    </Box>
  );
}

function Empty(): React.ReactElement {
  const t = useTokens();
  return <Text color={t.fgDim}>no service selected</Text>;
}

function DialogLayer({ kind, current }: { kind: DialogKind; current: Service | undefined }): React.ReactElement {
  const g = useGlyph();
  if (kind === 'delete' && current)
    return (
      <Dialog
        title="delete service"
        lines={['remove this service from svcd?', `${g('depends')} ${current.name}`]}
        actions={[{ key: 'N', label: 'keep', primary: true }, { key: 'y', label: 'delete' }]}
      />
    );
  if (kind === 'error')
    return (
      <Dialog
        title="error"
        variant="error"
        lines={[`${g('cross')} ${current ? current.name : 'service'} is missing on host`, "can't apply a service that isn't installed"]}
        actions={[{ key: 'enter', label: 'dismiss', primary: true }, { key: 'l', label: 'view log' }]}
      />
    );
  return (
    <Dialog
      title="keys"
      width={48}
      lines={['↑ ↓ / j k   move focus', 'tab         switch pane', '/  search   a  apply', 'd  delete   q  reset']}
      actions={[{ key: '?', label: 'close', primary: true }]}
    />
  );
}

const invokedDirectly = Boolean(process.argv[1] && /svcd\.(tsx|js)$/.test(process.argv[1]));
if (invokedDirectly && process.env.BLINK_DEMO_SNAPSHOT === '1') {
  // Snapshot mode: render one static, non-interactive frame at the 100×30 design
  // target into a buffer, then emit only the LAST frame to stdout. No raw mode,
  // no screen-clear, no stacked frames — a pristine ANSI screenshot. Pair with
  // FORCE_COLOR=3 to keep colours through a pipe.
  const frames: string[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      frames.push(chunk.toString());
      cb();
    },
  }) as Writable & { columns: number; rows: number; isTTY?: boolean };
  sink.columns = 100;
  sink.rows = 30;
  const iconSet = await detectIconSet();
  const instance = render(
    <ThemeProvider iconSet={iconSet}>
      <App interactive={false} />
    </ThemeProvider>,
    { stdout: sink as unknown as NodeJS.WriteStream, patchConsole: false },
  );
  setTimeout(() => {
    instance.unmount();
    process.stdout.write((frames.at(-1) ?? frames.join('')) + '\n');
    process.exit(0);
  }, 250);
} else if (invokedDirectly) {
  const iconSet = await detectIconSet();
  const instance = render(
    <ThemeProvider iconSet={iconSet}>
      <App />
    </ThemeProvider>,
  );
  // Headless verification hook: BLINK_DEMO_EXIT_MS=700 npm run example
  // auto-unmounts after N ms so a PTY smoke-test exits instead of hanging.
  const exitMs = Number(process.env.BLINK_DEMO_EXIT_MS);
  if (Number.isFinite(exitMs) && exitMs > 0) {
    setTimeout(() => instance.unmount(), exitMs);
  }
}

export { App };

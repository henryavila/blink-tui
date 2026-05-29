/**
 * showcase — every blink component on one screen, the live ComponentsShowcase.
 *
 * The "kitchen sink": a labelled `‹Component›` tour of the whole primitive set,
 * all on a single screen and all driven by the **intent, not style** API — rows
 * declare `state` / `domain` / `selected` by name and the framework paints them.
 * It dogfoods the new chrome primitives (`Header` as the top bar, `Banner` as the
 * in-flow notice, `DescriptionList` as the detail pane) alongside `Pane` tones,
 * `List`, `Input`, `Dialog`, `Spinner`, `ProgressBar`, and the glyph banks.
 *
 * Run it: `npm run example` → pick "showcase" (or `npx tsx examples/showcase.tsx`).
 * Keys: ↑↓/j k move · space select · / search · d delete · e error · ? help · q quit
 */
import React, { useEffect, useState } from 'react';
import { Writable } from 'node:stream';
import { render, Box, Text, useApp, useInput } from 'ink';
import {
  ThemeProvider,
  detectIconSet,
  Pane,
  List,
  Header,
  Banner,
  DescriptionList,
  Footer,
  Input,
  Dialog,
  Spinner,
  ProgressBar,
  Cursor,
  useTokens,
  useGlyph,
  useStdoutDimensions,
  registerGlyphs,
  COMMON_DOMAINS,
  catppuccinMocha as ctp,
  type ListRowData,
  type DescriptionItem,
} from '../src/index.js';

// blink core ships no domain glyphs; this showcase opts into the common pack —
// exactly as a real product would at boot (the framework owns the mechanism, the
// app owns the content).
registerGlyphs(COMMON_DOMAINS);

// ── specimen data — intent only: state + domain NAMES, never glyphs/colours ──
interface Proc {
  id: string;
  domain: string;
  name: string;
  state: string;
  meta: string;
}
const PROCS: Proc[] = [
  { id: 'pg', domain: 'postgresql', name: 'postgres@14.10', state: 'installed', meta: ':5432' },
  { id: 'redis', domain: 'redis', name: 'redis@7.2', state: 'installed', meta: ':6379' },
  { id: 'node', domain: 'nodejs', name: 'node · api', state: 'ok', meta: ':3000' },
  { id: 'nginx', domain: 'ubuntu', name: 'nginx', state: 'drift', meta: 'drift' },
  { id: 'graf', domain: 'database', name: 'grafana', state: 'missing', meta: 'missing' },
  { id: 'ssh', domain: 'ssh', name: 'ssh-agent', state: 'pending', meta: 'idle' },
];

interface Task {
  id: string;
  label: string;
  sel: boolean;
  exp?: 'open' | 'closed' | null;
  child?: boolean;
}
const TASKS: Task[] = [
  { id: 't1', label: 'pull latest images', sel: true, exp: null },
  { id: 't2', label: 'run migrations', sel: true, exp: 'open' },
  { id: 't3', label: '0001_init', sel: true, child: true },
  { id: 't4', label: '0002_add_index', sel: false, child: true },
  { id: 't5', label: 'restart services', sel: false, exp: 'closed' },
  { id: 't6', label: 'tail logs', sel: false, exp: null },
];

// Glyph banks (the ‹useGlyph› pane). Names resolve per icon set; colours are the
// framework's, shown here as a legend.
const STATE_BANK: Array<{ name: string; token: keyof ReturnType<typeof useTokens> }> = [
  { name: 'check', token: 'stateOk' },
  { name: 'cross', token: 'stateErr' },
  { name: 'circle', token: 'statePending' },
  { name: 'half', token: 'stateDrift' },
  { name: 'warn', token: 'stateWarn' },
  { name: 'rerun', token: 'stateInfo' },
  { name: 'checkboxOn', token: 'accent' },
  { name: 'checkboxOff', token: 'fgDim' },
];
const NAV_BANK = ['focus', 'collapsed', 'expanded', 'depends', 'flow', 'back'];
const DOMAIN_BANK: Array<{ name: string; label: string }> = [
  { name: 'postgresql', label: 'pg' },
  { name: 'redis', label: 'redis' },
  { name: 'docker', label: 'docker' },
  { name: 'git', label: 'git' },
  { name: 'nodejs', label: 'node' },
  { name: 'python', label: 'py' },
  { name: 'ssh', label: 'ssh' },
  { name: 'ai', label: 'ai' },
];
const ACCENTS: Array<{ color: string; label: string }> = [
  { color: ctp.lavender, label: 'lavender — accent / focus / brand' },
  { color: ctp.mauve, label: 'mauve — secondary brand' },
  { color: ctp.blue, label: 'blue — link / refs' },
  { color: ctp.yellow, label: 'yellow — highlight / match' },
];

// ── small specimen helpers — composed from primitives, contract-clean ──
function GlyphCell({ name, label, color }: { name: string; label: string; color: string }): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  return (
    <Box flexDirection="row" width={14}>
      <Box width={3} flexShrink={0}>
        <Text color={color} wrap="truncate">{g(name)}</Text>
      </Box>
      <Text color={t.fgDim} wrap="truncate">{label}</Text>
    </Box>
  );
}

function KeyChip({ k, accent = false }: { k: string; accent?: boolean }): React.ReactElement {
  const t = useTokens();
  return accent ? (
    <Text color={ctp.base} backgroundColor={t.accent}>{' ' + k + ' '}</Text>
  ) : (
    <Text color={t.fgInverse} backgroundColor={t.bgInverse}>{' ' + k + ' '}</Text>
  );
}

function BorderSpecimen({ label, tone, square = false }: { label: string; tone: 'resting' | 'focus' | 'error'; square?: boolean }): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  return (
    <Pane title={label} tone={tone} variant={square ? 'square' : undefined} flexGrow={0}>
      <Text color={t.fgDim}>
        {tone === 'error' ? (
          <Text><Text color={t.stateErr}>{g('cross')}</Text>{' error · red'}</Text>
        ) : tone === 'focus' ? (
          <Text><Text color={t.accent}>{g('focus')}</Text>{' focus · lavender'}</Text>
        ) : square ? (
          'square · legacy'
        ) : (
          'resting · muted'
        )}
      </Text>
    </Pane>
  );
}

type DialogKind = null | 'help' | 'delete' | 'error';

function App({
  interactive = true,
  onExit,
}: {
  interactive?: boolean;
  /** Called on `q`. The launcher passes "return to menu"; standalone falls back to quit. */
  onExit?: () => void;
} = {}): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  const { exit } = useApp();
  const leave = onExit ?? exit;
  const leaveLabel = onExit ? 'menu' : 'quit';
  const { rows } = useStdoutDimensions();

  const [focusIdx, setFocusIdx] = useState(2);
  const [sel, setSel] = useState<Set<string>>(new Set(['pg', 'redis']));
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<DialogKind>(null);

  const current = PROCS[Math.min(focusIdx, PROCS.length - 1)]!;

  useInput(
    (input, key) => {
      if (searching) {
        if (key.escape) {
          setSearching(false);
          setQuery('');
        } else if (key.return) setSearching(false);
        else if (key.backspace || key.delete) setQuery((q) => q.slice(0, -1));
        else if (input) setQuery((q) => q + input);
        return;
      }
      if (dialog) {
        if (key.escape || key.return || ['n', 'N', 'y', 'Y', '?', 'l'].includes(input)) setDialog(null);
        return;
      }
      if (key.downArrow || input === 'j') setFocusIdx((i) => Math.min(i + 1, PROCS.length - 1));
      else if (key.upArrow || input === 'k') setFocusIdx((i) => Math.max(i - 1, 0));
      else if (input === ' ') {
        const id = current.id;
        setSel((s) => {
          const n = new Set(s);
          if (n.has(id)) n.delete(id);
          else n.add(id);
          return n;
        });
      } else if (input === '/') setSearching(true);
      else if (input === '?') setDialog('help');
      else if (input === 'd') setDialog('delete');
      else if (input === 'e') setDialog('error');
      else if (input === 'q') leave();
    },
    { isActive: interactive },
  );

  const procRows: ListRowData[] = PROCS.map((p) => ({
    id: p.id,
    domain: p.domain,
    state: p.state,
    label: p.name,
    meta: p.meta,
  }));

  const okN = PROCS.filter((p) => p.state === 'installed' || p.state === 'ok').length;

  const detailItems: DescriptionItem[] = [
    { value: current.name },
    { value: 'detail of the focused row', muted: true },
    { term: 'state', state: current.state, value: current.state },
    { term: 'change', value: 'keep — no action' },
    { term: 'items', value: '4 steps' },
    { term: 'requires', value: `${g('depends')} pg · redis` },
  ];

  const footerKeys =
    dialog === 'help'
      ? [{ k: '?', desc: 'close' }]
      : dialog
        ? [{ k: 'esc', desc: 'cancel' }, { k: 'y', desc: 'confirm' }, { k: 'n', desc: 'no' }]
        : searching
          ? [{ k: 'esc', desc: 'clear' }, { k: 'enter', desc: 'done' }]
          : [
              { k: '↑↓', desc: 'move' },
              { k: 'spc', desc: 'select' },
              { k: '/', desc: 'search' },
              { k: 'd', desc: 'delete' },
              { k: 'e', desc: 'error' },
              { k: '?', desc: 'keys' },
              { k: 'q', desc: leaveLabel },
            ];

  // Reserve one spare row so Ink stays on the incremental-erase path (no flicker).
  const totalH = Math.max(1, rows - 1);

  return (
    <Box flexDirection="column" height={totalH}>
      {/* title bar — the Header primitive (mark + title + right status) */}
      <Header
        mark={<Cursor />}
        title="blink"
        subtitle="‹Header›"
        right={
          <Box flexDirection="row">
            <Spinner active={interactive} />
            <Text color={t.fgMuted}>{' every primitive on one screen'}</Text>
          </Box>
        }
      />

      {dialog ? (
        <Box flexGrow={1} minHeight={0}>
          <DialogLayer kind={dialog} current={current} />
        </Box>
      ) : (
        <Box flexDirection="row" flexGrow={1} minHeight={0}>
          {/* ── column A : lists ── */}
          <Box flexDirection="column" flexGrow={1} flexBasis={0} minWidth={0}>
            <Pane title="processes ‹List›" tone={searching ? 'resting' : 'focus'} flexGrow={2}>
              <List rows={procRows} focusedId={current.id} selectedIds={sel} />
              <Text> </Text>
              <Text color={t.fgFaint}>{`${g('focus')} focus · fill · spc selects`}</Text>
            </Pane>
            <Pane title="tasks ‹glyphs›" flexGrow={0}>
              {TASKS.map((task) => (
                <Box key={task.id} flexDirection="row">
                  <Box width={2} flexShrink={0}>
                    <Text color={t.accent}>
                      {task.exp === 'open' ? g('expanded') : task.exp === 'closed' ? g('collapsed') : ' '}
                    </Text>
                  </Box>
                  <Box width={2} flexShrink={0}>
                    <Text color={task.sel ? t.accent : t.fgDim}>
                      {task.child ? ' ' : task.sel ? g('checkboxOn') : g('checkboxOff')}
                    </Text>
                  </Box>
                  <Text color={task.child ? t.fgDim : t.fg} wrap="truncate">
                    {task.child ? `${g('depends')} ${task.label}` : task.label}
                  </Text>
                </Box>
              ))}
            </Pane>
            <Pane title="detail ‹DescriptionList›" flexGrow={2}>
              <DescriptionList items={detailItems} gutter={9} />
            </Pane>
          </Box>

          {/* ── column B : inputs + glyphs ── */}
          <Box flexDirection="column" flexGrow={1} flexBasis={0} minWidth={0}>
            <Pane title="inputs ‹Input›" flexGrow={0}>
              <Input title="filter" value={searching ? query : ''} placeholder="type to filter…" focused={searching} />
              <Text> </Text>
              <Input title="host" value="db.internal:5432" />
              <Text> </Text>
              <Input title="token" value="" placeholder="paste token" error="required — field is empty" />
            </Pane>
            <Pane title="glyphs ‹useGlyph›" flexGrow={1}>
              <Text color={t.fgFaint}>state</Text>
              <Box flexDirection="row" flexWrap="wrap">
                {STATE_BANK.map((s) => (
                  <GlyphCell key={s.name} name={s.name} label={s.name} color={t[s.token] as string} />
                ))}
              </Box>
              <Text> </Text>
              <Text color={t.fgFaint}>navigation</Text>
              <Box flexDirection="row" flexWrap="wrap">
                {NAV_BANK.map((n) => (
                  <GlyphCell key={n} name={n} label={n} color={t.fgMuted} />
                ))}
              </Box>
              <Text> </Text>
              <Text color={t.fgFaint}>app glyphs · registered, not core</Text>
              <Box flexDirection="row" flexWrap="wrap">
                {DOMAIN_BANK.map((d) => (
                  <GlyphCell key={d.name} name={d.name} label={d.label} color={t.fgMuted} />
                ))}
              </Box>
            </Pane>
          </Box>

          {/* ── column C : status, tokens, borders ── */}
          <Box flexDirection="column" flexGrow={1} flexBasis={0} minWidth={0}>
            <Pane title="motion ‹Spinner›" flexGrow={0}>
              <Box flexDirection="row">
                <Spinner active={interactive} />
                <Text color={t.stateInfo}>{' syncing  '}</Text>
                <Text color={t.fgDim}>3/12</Text>
              </Box>
              <Box flexDirection="row">
                <ProgressBar value={0.62} width={18} />
                <Text color={t.fgDim}>{' 62%'}</Text>
              </Box>
              <Text> </Text>
              <Box flexDirection="row">
                <Text color={t.stateOk}>{`${g('check')} ${okN}`}</Text>
                <Text color={t.statePending}>{`  ${g('circle')} 1`}</Text>
                <Text color={t.stateDrift}>{`  ${g('half')} 1`}</Text>
                <Text color={t.stateErr}>{`  ${g('cross')} 1`}</Text>
              </Box>
              <Box flexDirection="row">
                <Text color={t.stateWarn}>{g('warn')}</Text>
                <Text color={t.fgDim}>{' nginx config out-of-date'}</Text>
              </Box>
            </Pane>
            <Pane title="tokens ‹theme›" flexGrow={0}>
              <Text color={t.fg}>text · cdd6f4 — default fg</Text>
              <Text color={t.fgMuted}>bac2de — muted</Text>
              <Text color={t.fgDim}>a6adc8 — dim / hints</Text>
              <Text> </Text>
              {ACCENTS.map((a) => (
                <Text key={a.label} color={a.color}>{`● ${a.label}`}</Text>
              ))}
              <Text> </Text>
              <Text color={t.fgFaint}>inverse = "bold"</Text>
              <Box flexDirection="row" gap={1}>
                <KeyChip k="TAB" />
                <KeyChip k="↵" />
                <KeyChip k="?" accent />
              </Box>
            </Pane>
            <Pane title="borders ‹Pane›" flexGrow={1}>
              <BorderSpecimen label="resting" tone="resting" />
              <BorderSpecimen label="focus" tone="focus" />
              <BorderSpecimen label="error" tone="error" />
              <BorderSpecimen label="square" tone="resting" square />
            </Pane>
          </Box>
        </Box>
      )}

      {/* banner — one-line in-flow notice, above the footer */}
      {dialog ? null : (
        <Box flexDirection="row" justifyContent="space-between">
          <Banner tone="success">auto-selected mysql, redis — required by web/valet</Banner>
          <Text color={t.fgFaint}>{'‹Banner› '}</Text>
        </Box>
      )}

      <Footer keys={footerKeys} right={`‹Footer› · ${sel.size} selected`} />
    </Box>
  );
}

function DialogLayer({ kind, current }: { kind: DialogKind; current: Proc }): React.ReactElement {
  const g = useGlyph();
  if (kind === 'delete')
    return (
      <Dialog
        title="delete process"
        lines={['remove this process from the host?', `${g('depends')} ${current.name}`]}
        actions={[{ key: 'N', label: 'keep', primary: true }, { key: 'y', label: 'delete' }]}
      />
    );
  if (kind === 'error')
    return (
      <Dialog
        title="error"
        tone="error"
        width={52}
        lines={[`${g('cross')} ${current.name} — port in use`, 'another process is bound to this port']}
        actions={[{ key: 'enter', label: 'dismiss', primary: true }, { key: 'l', label: 'view log' }]}
      />
    );
  return (
    <Dialog
      title="keys"
      width={50}
      lines={[
        '↑ ↓ / j k   move focus      spc   select',
        '/           search          d     delete',
        'e           error dialog    ?     this help',
      ]}
      actions={[{ key: '?', label: 'close', primary: true }]}
    />
  );
}

const invokedDirectly = Boolean(process.argv[1] && /showcase\.(tsx|js)$/.test(process.argv[1]));

if (invokedDirectly && process.env.BLINK_DEMO_SNAPSHOT === '1') {
  // Static snapshot: one non-interactive frame at the showcase's native 120×40
  // canvas (denser than the 100×30 app target — it carries nine panes at once).
  const frames: string[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      frames.push(chunk.toString());
      cb();
    },
  }) as Writable & { columns: number; rows: number; isTTY?: boolean };
  sink.columns = 120;
  sink.rows = 41;
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
  const exitMs = Number(process.env.BLINK_DEMO_EXIT_MS);
  if (Number.isFinite(exitMs) && exitMs > 0) {
    setTimeout(() => instance.unmount(), exitMs);
  }
}

export { App };

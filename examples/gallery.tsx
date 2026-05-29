/**
 * gallery — every blink component on one screen.
 *
 * A live "kitchen sink" that exercises the full primitive set at the 100×30
 * design target: a keyboard-windowed multi-select `List` (driven by the headless
 * `useListNavigation` + `useListSelection` hooks), `Banner` notices in three
 * tones, a presentational `Input` with the blinking cursor, a `Spinner` and a
 * determinate `ProgressBar` side by side, a tailing `LogView`, and a `Dialog`
 * with a rich `children` body. Keyboard only.
 *
 * Run it: `npm run example:gallery` (or `npx tsx examples/gallery.tsx`).
 * Keys: ↑↓/j k move · space select · g/G first/last · / search · d dialog ·
 *       p pause · c clear · q quit
 */
import React, { useEffect, useRef, useState } from 'react';
import { Writable } from 'node:stream';
import { render, Box, Text, useApp, useInput } from 'ink';
import {
  ThemeProvider,
  detectIconSet,
  Pane,
  List,
  LogView,
  Footer,
  Input,
  Dialog,
  Banner,
  Spinner,
  ProgressBar,
  useTokens,
  useGlyph,
  useStdoutDimensions,
  useListNavigation,
  useListSelection,
  blocks,
  type ListRowData,
} from '../src/index.js';

type ModState = 'ok' | 'warn' | 'pending';

interface Module {
  id: string;
  label: string;
  state: ModState;
  detail: string;
}

const STATE_CYCLE: ModState[] = ['ok', 'ok', 'warn', 'ok', 'pending', 'ok'];
const DETAILS = ['in sync', 'needs attention', 'building…', 'idle', 'queued', 'healthy'];

// 30 modules so the list overflows any window and the ▴/▾ markers always show.
const MODULES: Module[] = Array.from({ length: 30 }, (_, i) => {
  const state = STATE_CYCLE[i % STATE_CYCLE.length]!;
  return {
    id: `m${String(i + 1).padStart(2, '0')}`,
    label: `module-${String(i + 1).padStart(2, '0')}`,
    state,
    detail: state === 'warn' ? 'needs attention' : DETAILS[i % DETAILS.length]!,
  };
});

const STATE_GLYPH: Record<ModState, { name: string; token: 'stateOk' | 'stateWarn' | 'statePending'; word: string }> = {
  ok: { name: 'check', token: 'stateOk', word: 'ok' },
  warn: { name: 'warn', token: 'stateWarn', word: 'warn' },
  pending: { name: 'circle', token: 'statePending', word: 'pending' },
};

interface SeedState {
  query: string;
  selected: string[];
  progress: number;
  log: string[];
  showDialog: boolean;
  /** Snapshot-only: render the search `Input` focused (rounded border) without
   *  entering search mode, so the static frame showcases the rounded treatment
   *  while the full hotkey footer stays visible. */
  focusSearch?: boolean;
}

function App({
  interactive = true,
  seed,
  onExit,
}: {
  interactive?: boolean;
  seed?: SeedState;
  /** Called on `q`. The launcher passes "return to menu"; standalone falls back to quit. */
  onExit?: () => void;
} = {}): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  const { exit } = useApp();
  const leave = onExit ?? exit;
  const leaveLabel = onExit ? 'menu' : 'quit';
  const { rows } = useStdoutDimensions();

  const [query, setQuery] = useState(seed?.query ?? '');
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(seed?.progress ?? 0.0);
  const [log, setLog] = useState<string[]>(seed?.log ?? ['gallery ready', 'arrows move · space selects']);
  const [paused, setPaused] = useState(!interactive);
  const [showDialog, setShowDialog] = useState(seed?.showDialog ?? false);

  const filtered = MODULES.filter(
    (m) => query === '' || m.label.toLowerCase().includes(query.toLowerCase()),
  );
  const ids = filtered.map((m) => m.id);

  const nav = useListNavigation({ ids });
  const sel = useListSelection({ ids: MODULES.map((m) => m.id), mode: 'multi', initial: seed?.selected });

  // Keep focus valid as the filter narrows the list.
  const idsKey = ids.join(',');
  useEffect(() => {
    if (nav.focusedIndex < 0 && ids.length > 0) nav.focusFirst();
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The one timer: advance the progress bar and append a log line so the
  // ProgressBar, Spinner, and LogView are all visibly live.
  const tick = useRef(seed?.log?.length ?? 0);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      tick.current += 1;
      setProgress((p) => (p >= 1 ? 0 : Math.min(1, p + 0.04)));
      setLog((l) => [...l.slice(-200), `tick ${tick.current}: ${g('flow')} processed batch ${tick.current}`]);
    }, 140);
    return () => clearInterval(id);
  }, [paused, g]);

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
      if (showDialog) {
        if (key.escape || key.return || input === 'd') setShowDialog(false);
        return;
      }
      if (key.downArrow || input === 'j') nav.focusNext();
      else if (key.upArrow || input === 'k') nav.focusPrev();
      else if (input === 'g') nav.focusFirst();
      else if (input === 'G') nav.focusLast();
      else if (input === ' ' && nav.focusedId) sel.toggle(nav.focusedId);
      else if (input === '/') setSearching(true);
      else if (input === 'd') setShowDialog(true);
      else if (input === 'p') setPaused((p) => !p);
      else if (input === 'c') sel.clear();
      else if (input === 'q') leave(); // back to menu (launcher) or quit (standalone)
    },
    { isActive: interactive },
  );

  const warnCount = MODULES.filter((m) => m.state === 'warn').length;
  const selCount = sel.selectedIds.size;

  const rowsData: ListRowData[] = filtered.map((m) => {
    const sg = STATE_GLYPH[m.state];
    return {
      id: m.id,
      glyph: g(sg.name),
      glyphColor: t[sg.token],
      label: m.label,
      meta: m.detail,
    };
  });

  // Layout heights, derived from the terminal (no flex measurement needed).
  const totalH = Math.max(1, rows - 1);
  const bodyH = Math.max(10, totalH - 2); // minus title + footer
  const paneInner = bodyH - 2; // inside a pane's top/bottom border
  const listH = Math.min(12, Math.max(4, paneInner)); // punchy window so markers show
  const logPaneH = Math.max(4, paneInner - 13); // right column: banners+input+bar+log
  const logH = Math.max(2, logPaneH - 2);

  const footerKeys = searching
    ? [{ k: 'esc', desc: 'clear' }, { k: 'enter', desc: 'done' }]
    : showDialog
      ? [{ k: 'esc', desc: 'close' }]
      : [
          { k: '↑↓', desc: 'move' },
          { k: 'spc', desc: 'select' },
          { k: '/', desc: 'search' },
          { k: 'd', desc: 'dialog' },
          { k: 'p', desc: paused ? 'play' : 'pause' },
          { k: 'c', desc: 'clear' },
          { k: 'q', desc: leaveLabel },
        ];
  // Keep this compact so the `q quit` chip always fits the footer at 100 cols
  // (the focused id is already shown by the list caret).
  const right = `${g('checkboxOn')} ${selCount}/${MODULES.length}`;

  return (
    <Box flexDirection="column" height={totalH}>
      {/* title bar */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Box>
          <Text color={t.fgInverse} backgroundColor={t.bgInverse}>{`${blocks.cursor} blink `}</Text>
          <Text color={t.fgInverse} backgroundColor={t.bgInverse} dimColor>{'· component gallery '}</Text>
        </Box>
        <Text color={t.fgDim}>{`${Math.round(progress * 100)}%`}</Text>
      </Box>

      {showDialog ? (
        <Box flexGrow={1} minHeight={0}>
          <SelectionDialog selectedIds={sel.selectedIds} />
        </Box>
      ) : (
        <Box flexDirection="row" flexGrow={1} minHeight={0}>
          {/* LEFT — windowed multi-select list */}
          <Box flexDirection="column" flexBasis="44%" flexShrink={0}>
            <Pane title={`modules (${filtered.length})`} focused flexGrow={0} height={listH + 2}>
              <List
                rows={rowsData}
                focusedId={nav.focusedId}
                selectedIds={sel.selectedIds}
                height={listH}
              />
            </Pane>
            <Pane title="hooks" flexGrow={1}>
              <Text color={t.fgDim}>{`${g('focus')} useListNavigation — focus`}</Text>
              <Text color={t.fgDim}>{`${g('checkboxOn')} useListSelection — ${selCount} selected`}</Text>
              <Text color={t.fgDim}>{`${g('moreBelow')} useListWindow — paged window`}</Text>
            </Pane>
          </Box>

          {/* RIGHT — the rest of the primitives */}
          <Pane title="primitives" flexBasis="56%">
            <Banner tone="info" glyph={g('flow')}>
              arrows move · space selects · / search
            </Banner>
            {warnCount > 0 ? (
              <Banner tone="warn" glyph={g('warn')} text={`${warnCount} modules need attention`} />
            ) : null}
            {selCount > 0 ? (
              <Banner tone="success" glyph={g('check')} text={`${selCount} selected for batch`} />
            ) : null}
            <Text> </Text>

            <Input
              title="search"
              value={query}
              placeholder="type to filter modules…"
              focused={searching || Boolean(seed?.focusSearch)}
            />
            <Text> </Text>

            <Box flexDirection="row">
              <Text color={t.fgFaint}>{'build  '}</Text>
              <Spinner active={!paused} />
              <Text>{'  '}</Text>
              <ProgressBar value={progress} width={20} />
              <Text color={t.fgDim}>{` ${Math.round(progress * 100)}%`}</Text>
            </Box>
            <Text> </Text>

            <Pane title="log" flexGrow={1}>
              <LogView lines={log} height={logH} />
            </Pane>
          </Pane>
        </Box>
      )}

      <Footer keys={footerKeys} right={right} />
    </Box>
  );
}

function SelectionDialog({ selectedIds }: { selectedIds: Set<string> }): React.ReactElement {
  const g = useGlyph();
  const chosen = MODULES.filter((m) => selectedIds.has(m.id));
  const rows: ListRowData[] = (chosen.length > 0 ? chosen : MODULES.slice(0, 3)).map((m) => ({
    id: m.id,
    glyph: g(STATE_GLYPH[m.state].name),
    label: m.label,
    meta: m.detail,
  }));
  return (
    <Box flexGrow={1} justifyContent="center" alignItems="center">
      <Box width={48} flexShrink={0}>
        <Dialog
          title={chosen.length > 0 ? `selection (${chosen.length})` : 'selection (none)'}
          actions={[{ key: 'esc', label: 'close', primary: true }]}
        >
          {/* R6: a rich children body — a List inside the modal. */}
          <List rows={rows} height={6} />
        </Dialog>
      </Box>
    </Box>
  );
}

const invokedDirectly = Boolean(process.argv[1] && /gallery\.(tsx|js)$/.test(process.argv[1]));

if (invokedDirectly && process.env.BLINK_DEMO_SNAPSHOT === '1') {
  // Static snapshot: one non-interactive frame at 100×30 with a representative
  // seed (selections, mid-progress, a few log lines) so every component shows.
  const frames: string[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      frames.push(chunk.toString());
      cb();
    },
  }) as Writable & { columns: number; rows: number; isTTY?: boolean };
  sink.columns = 100;
  sink.rows = 31;
  const seed: SeedState = {
    query: '',
    selected: ['m03', 'm06', 'm09'],
    progress: 0.62,
    log: ['gallery ready', 'tick 1: → processed batch 1', 'tick 2: → processed batch 2', 'tick 3: → processed batch 3'],
    showDialog: false,
    focusSearch: true,
  };
  const iconSet = await detectIconSet();
  const instance = render(
    <ThemeProvider iconSet={iconSet}>
      <App interactive={false} seed={seed} />
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

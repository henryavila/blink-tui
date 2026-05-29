/**
 * examples — the blink demo launcher.
 *
 * The one entrypoint (`npm run example`): a menu of demo screens. Pick one with
 * ↑↓ + enter to open it full-screen; press `q` inside a screen to come back
 * here, `q` here to quit. Each screen is a standalone blink app, mounted in
 * place of the menu (never nested), so its input handling owns the keyboard
 * while it's up.
 *
 * The menu itself is built from blink primitives (Pane + List + Footer) driven
 * by the headless `useListNavigation` hook — the launcher dogfoods the library.
 *
 * Run it: `npm run example` (or `npx tsx examples/index.tsx`).
 */
import React, { useState } from 'react';
import { Writable } from 'node:stream';
import { render, Box, Text, useApp, useInput } from 'ink';
import {
  ThemeProvider,
  detectIconSet,
  Pane,
  List,
  Footer,
  useTokens,
  useGlyph,
  useStdoutDimensions,
  useListNavigation,
  blocks,
  type ListRowData,
} from '../src/index.js';
import { App as Svcd } from './svcd.js';
import { App as Showcase } from './showcase.js';

type ScreenId = 'svcd' | 'showcase';

interface Screen {
  id: ScreenId;
  name: string;
  tagline: string;
  blurb: string[];
  Component: (props: { onExit?: () => void }) => React.ReactElement;
}

const SCREENS: Screen[] = [
  {
    id: 'svcd',
    name: 'svcd',
    tagline: 'services manager · reference app',
    blurb: [
      'The narrative reference — a fictional',
      'local-services manager that reads like a',
      'real tool.',
      '',
      'Shows: Pane · List · Footer · Input ·',
      'Dialog · Spinner.',
    ],
    Component: Svcd,
  },
  {
    id: 'showcase',
    name: 'showcase',
    tagline: 'inventory · every token & primitive',
    blurb: [
      'The scrolling inventory: every colour,',
      'token, glyph tier and component on one',
      'keyboard-paged page — with a live theme',
      'picker (t / T switches all 7 themes).',
      '',
      'Adds: themes · Header · Banner ·',
      'DescriptionList · Pane tones · Spinner.',
    ],
    Component: Showcase,
  },
];

function Menu({
  onOpen,
  onQuit,
  interactive = true,
}: {
  onOpen: (id: ScreenId) => void;
  onQuit: () => void;
  interactive?: boolean;
}): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  const { rows } = useStdoutDimensions();
  const nav = useListNavigation({ ids: SCREENS.map((s) => s.id) });

  useInput(
    (input, key) => {
      if (key.downArrow || input === 'j') nav.focusNext();
      else if (key.upArrow || input === 'k') nav.focusPrev();
      else if (key.return && nav.focusedId) onOpen(nav.focusedId as ScreenId);
      else if (input === 'q') onQuit();
    },
    { isActive: interactive },
  );

  const focused = SCREENS.find((s) => s.id === nav.focusedId) ?? SCREENS[0]!;
  const rowsData: ListRowData[] = SCREENS.map((s) => ({
    id: s.id,
    label: s.name,
    meta: s.tagline.split(' · ')[0],
  }));

  const totalH = Math.max(1, rows - 1);

  return (
    <Box flexDirection="column" height={totalH}>
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Box>
          <Text color={t.fgInverse} backgroundColor={t.bgInverse}>{`${blocks.cursor} blink `}</Text>
          <Text color={t.fgInverse} backgroundColor={t.bgInverse} dimColor>{'· examples '}</Text>
        </Box>
        <Text color={t.fgDim}>{'pick a screen'}</Text>
      </Box>

      <Box flexDirection="row" flexGrow={1} minHeight={0}>
        <Pane title={`screens (${SCREENS.length})`} focused flexBasis="40%">
          <List rows={rowsData} focusedId={nav.focusedId} />
        </Pane>
        <Pane title={focused.name} flexBasis="60%">
          <Text color={t.fg}>{focused.tagline}</Text>
          <Text> </Text>
          {focused.blurb.map((line, i) => (
            <Text key={i} color={t.fgDim}>
              {line === '' ? ' ' : line}
            </Text>
          ))}
          <Text> </Text>
          <Text color={t.fgFaint}>{`${g('depends')} enter opens · q inside returns here`}</Text>
        </Pane>
      </Box>

      <Footer
        keys={[
          { k: '↑↓', desc: 'move' },
          { k: 'enter', desc: 'open' },
          { k: 'q', desc: 'quit' },
        ]}
        right={`${SCREENS.length} screens`}
      />
    </Box>
  );
}

function Launcher({ interactive = true }: { interactive?: boolean } = {}): React.ReactElement {
  const { exit } = useApp();
  const [screen, setScreen] = useState<ScreenId | null>(null);

  if (screen) {
    const Active = SCREENS.find((s) => s.id === screen)!.Component;
    return <Active onExit={() => setScreen(null)} />;
  }
  return <Menu onOpen={setScreen} onQuit={exit} interactive={interactive} />;
}

const invokedDirectly = Boolean(process.argv[1] && /index\.(tsx|js)$/.test(process.argv[1]));

if (invokedDirectly && process.env.BLINK_DEMO_SNAPSHOT === '1') {
  // Static snapshot of the menu at the 100×30 design target.
  const frames: string[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      frames.push(chunk.toString());
      cb();
    },
  }) as Writable & { columns: number; rows: number; isTTY?: boolean };
  sink.columns = 100;
  sink.rows = 31;
  const iconSet = await detectIconSet();
  const instance = render(
    <ThemeProvider iconSet={iconSet}>
      <Launcher interactive={false} />
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
      <Launcher />
    </ThemeProvider>,
  );
  const exitMs = Number(process.env.BLINK_DEMO_EXIT_MS);
  if (Number.isFinite(exitMs) && exitMs > 0) {
    setTimeout(() => instance.unmount(), exitMs);
  }
}

export { Launcher, Menu, SCREENS };

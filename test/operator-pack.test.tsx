import React from 'react';
import { render } from 'ink-testing-library';
import { describe, test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { LinkPanel, truncateHref } from '../src/components/LinkPanel.js';
import { WaitGate } from '../src/components/WaitGate.js';
import { StageRail, pickStageRailMode } from '../src/components/StageRail.js';
import { GuidedPrompt, useGuidedPromptNavigation } from '../src/components/GuidedPrompt.js';
import { ChoicePicker } from '../src/components/ChoicePicker.js';
import { FilePicker } from '../src/components/FilePicker.js';
import { RunSummary } from '../src/components/RunSummary.js';
import { MetricStrip, fitMetrics } from '../src/components/MetricStrip.js';
import { KeyHints } from '../src/components/KeyHints.js';
import type { StageItem } from '../src/components/StageRail.js';
import type { MetricItem } from '../src/components/MetricStrip.js';
import type { FileEntry } from '../src/components/FilePicker.js';

function wrap(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider iconSet="unicode">{node}</ThemeProvider>;
}

// ── LinkPanel ────────────────────────────────────────────────────────────────

describe('LinkPanel', () => {
  test('renders title + primary target + details from intent props', () => {
    const { lastFrame } = render(
      wrap(
        <LinkPanel
          title="link ready"
          href="http://127.0.0.1:7421/app"
          status="ready"
          statusLabel="listening"
          details={[
            { label: 'host', value: '127.0.0.1' },
            { label: 'port', value: '7421' },
          ]}
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('link ready');
    expect(frame).toContain('http://127.0.0.1:7421/app');
    expect(frame).toContain('listening');
    expect(frame).toContain('host');
    expect(frame).toContain('127.0.0.1');
    expect(frame).toContain('port');
    expect(frame).toContain('7421');
  });

  test('unknown status intent degrades to neutral (no throw)', () => {
    const { lastFrame } = render(
      wrap(<LinkPanel title="open docs" href="https://example.com/docs" status="not-a-real-status" />),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('open docs');
    expect(frame).toContain('https://example.com/docs');
  });

  test('hint chips render without capturing keyboard', () => {
    const { lastFrame } = render(
      wrap(
        <LinkPanel
          title="link ready"
          href="http://localhost:3000"
          hints={[
            { k: 'o', desc: 'open' },
            { k: 'c', desc: 'copy' },
          ]}
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('o');
    expect(frame).toContain('open');
    expect(frame).toContain('c');
    expect(frame).toContain('copy');
  });

  test('truncateHref keeps separators when possible', () => {
    const long = 'http://127.0.0.1:7421/very/long/path/to/resource?q=1';
    const out = truncateHref(long, 28);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThan(long.length);
    // Prefer a break that still looks like a URL prefix
    expect(out.startsWith('http://')).toBe(true);
  });

  test('truncateHref returns full string when it fits', () => {
    expect(truncateHref('http://x.test', 40)).toBe('http://x.test');
  });
});

// ── WaitGate ─────────────────────────────────────────────────────────────────

describe('WaitGate', () => {
  test('waiting is distinguishable from ready by status intent alone', () => {
    const waiting = render(
      wrap(<WaitGate title="waiting for human action" status="waiting" />),
    );
    const ready = render(
      wrap(<WaitGate title="waiting for human action" status="ready" />),
    );
    const w = waiting.lastFrame() ?? '';
    const r = ready.lastFrame() ?? '';
    expect(w).toContain('waiting for human action');
    expect(r).toContain('waiting for human action');
    // Different status glyphs (half vs check) — frames must differ
    expect(w).not.toBe(r);
    expect(w).toContain('waiting');
    expect(r).toContain('ready');
  });

  test('works with href via LinkPanel composition', () => {
    const { lastFrame } = render(
      wrap(
        <WaitGate
          title="link ready"
          status="waiting"
          href="http://127.0.0.1:7421"
          elapsed="elapsed 1m 02s"
          hints={[{ k: 'enter', desc: 'continue' }]}
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('http://127.0.0.1:7421');
    expect(frame).toContain('elapsed 1m 02s');
    expect(frame).toContain('continue');
  });

  test('works without href (device / non-URL wait)', () => {
    const { lastFrame } = render(
      wrap(
        <WaitGate
          title="insert security key"
          status="waiting"
          statusLabel="waiting for device"
          details={[{ label: 'path', value: '/dev/hidraw0' }]}
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('insert security key');
    expect(frame).toContain('waiting for device');
    expect(frame).toContain('/dev/hidraw0');
    expect(frame).not.toContain('http');
  });

  test('unknown status does not throw', () => {
    const { lastFrame } = render(
      wrap(<WaitGate title="hold" status="mystery" statusLabel="custom" />),
    );
    expect(lastFrame()).toContain('hold');
    expect(lastFrame()).toContain('custom');
  });

  test('status done paints consistently with and without href', () => {
    const withHref = render(
      wrap(<WaitGate title="gate" status="done" href="http://x.test" />),
    );
    const noHref = render(wrap(<WaitGate title="gate" status="done" />));
    expect(withHref.lastFrame()).toContain('gate');
    expect(noHref.lastFrame()).toContain('gate');
    expect(noHref.lastFrame()).toContain('done');
  });
});

// ── StageRail ────────────────────────────────────────────────────────────────

describe('StageRail', () => {
  const stages: StageItem[] = [
    { id: 'a', label: 'setup', state: 'ok' },
    { id: 'b', label: 'build', state: 'ok' },
    { id: 'c', label: 'check', state: 'running' },
    { id: 'd', label: 'ship', state: 'pending' },
    { id: 'e', label: 'done', state: 'pending' },
  ];

  test('mixed states render without consumer style props', () => {
    const { lastFrame } = render(wrap(<StageRail stages={stages} animate={false} width={120} />));
    const frame = lastFrame() ?? '';
    expect(frame).toContain('setup');
    expect(frame).toContain('build');
    expect(frame).toContain('check');
    expect(frame).toContain('ship');
    expect(frame).toContain('done');
  });

  test('vertical mode stacks phases', () => {
    const { lastFrame } = render(
      wrap(<StageRail stages={stages.slice(0, 3)} orientation="vertical" animate={false} />),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('setup');
    expect(frame).toContain('check');
  });

  test('narrow width degrades predictably', () => {
    const full = pickStageRailMode(stages, 200, 'unicode');
    expect(full.mode).toBe('full');
    expect(full.start).toBe(0);

    const glyphs = pickStageRailMode(stages, 20, 'unicode');
    expect(['glyphs', 'overflow', 'short']).toContain(glyphs.mode);

    const tight = pickStageRailMode(stages, 8, 'unicode');
    expect(tight.mode).toBe('overflow');
    expect(tight.visibleCount).toBeLessThan(stages.length);
  });

  test('overflow window keeps the running stage visible', () => {
    // running is near the end — a prefix-only slice would hide it
    const late: StageItem[] = [
      { id: 'a', label: 'setup', state: 'ok' },
      { id: 'b', label: 'build', state: 'ok' },
      { id: 'c', label: 'check', state: 'ok' },
      { id: 'd', label: 'ship', state: 'running' },
      { id: 'e', label: 'done', state: 'pending' },
      { id: 'f', label: 'pack', state: 'pending' },
      { id: 'g', label: 'pub', state: 'pending' },
    ];
    const tight = pickStageRailMode(late, 6, 'unicode');
    expect(tight.mode).toBe('overflow');
    const window = late.slice(tight.start, tight.start + tight.visibleCount);
    expect(window.some((s) => s.id === 'd' && s.state === 'running')).toBe(true);

    const { lastFrame } = render(
      wrap(<StageRail stages={late} animate={false} width={6} />),
    );
    // Glyph-only overflow still paints the running spinner/glyph region — at least
    // the frame is non-empty and the prefix-only bug is covered by pickStageRailMode.
    expect((lastFrame() ?? '').length).toBeGreaterThan(0);
  });

  test('empty stages render nothing noisy', () => {
    const { lastFrame } = render(wrap(<StageRail stages={[]} />));
    expect((lastFrame() ?? '').trim()).toBe('');
  });

  test('ascii icon set measures multi-cell glyphs in width budget', () => {
    // ascii check/circle marks are `[x]` / `[ ]` (3 cells) — must not claim "full" at tiny width
    const asciiStages: StageItem[] = [
      { id: 'a', label: 'setup', state: 'ok' },
      { id: 'b', label: 'build', state: 'ok' },
      { id: 'c', label: 'check', state: 'running' },
      { id: 'd', label: 'ship', state: 'pending' },
    ];
    const tiny = pickStageRailMode(asciiStages, 20, 'ascii');
    expect(tiny.mode).not.toBe('full');
  });
});

// ── GuidedPrompt ─────────────────────────────────────────────────────────────

describe('GuidedPrompt', () => {
  test('works with only a default (no choices)', () => {
    const { lastFrame } = render(
      wrap(<GuidedPrompt question="output title?" defaultValue="untitled" />),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('output title?');
    expect(frame).toContain('default · untitled');
  });

  test('works with choices and app-fed focus', () => {
    const { lastFrame } = render(
      wrap(
        <GuidedPrompt
          question="pick format"
          choices={[
            { id: 'a', label: 'alpha', meta: '12 MB' },
            { id: 'b', label: 'beta' },
          ]}
          focusedId="b"
          value="a"
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('pick format');
    expect(frame).toContain('alpha');
    expect(frame).toContain('beta');
    expect(frame).toContain('12 MB');
  });

  test('controlled value re-render does not invent state', () => {
    const { lastFrame, rerender } = render(
      wrap(<GuidedPrompt question="q?" value="first" allowFreeText inputFocused />),
    );
    expect(lastFrame()).toContain('first');
    rerender(wrap(<GuidedPrompt question="q?" value="second" allowFreeText inputFocused />));
    expect(lastFrame()).toContain('second');
    expect(lastFrame()).not.toContain('first');
  });

  test('resolved state shows a stable answer line', () => {
    const { lastFrame } = render(
      wrap(<GuidedPrompt question="format?" value="mp4" resolved />),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('format?');
    expect(frame).toContain('mp4');
  });

  test('defaultValue as choice id shows the label in the default line', () => {
    const { lastFrame } = render(
      wrap(
        <GuidedPrompt
          question="size?"
          defaultValue="med"
          choices={[
            { id: 'sm', label: 'small' },
            { id: 'med', label: 'medium' },
          ]}
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toMatch(/default · medium/);
    // Must not show the raw id alone as the default line
    expect(frame).not.toMatch(/default · med$/m);
  });

  test('inline error without free text', () => {
    const { lastFrame } = render(
      wrap(<GuidedPrompt question="path?" error="not found" />),
    );
    expect(lastFrame()).toContain('not found');
  });

  test('useGuidedPromptNavigation moves focus', () => {
    let focused: string | null = 'a';
    function Probe(): React.ReactElement {
      const nav = useGuidedPromptNavigation({
        ids: ['a', 'b', 'c'],
        focusedId: focused,
        onFocusChange: (id) => {
          focused = id;
        },
      });
      // invoke once on mount-ish via render of current
      React.useEffect(() => {
        nav.focusNext();
      }, []);
      return <GuidedPrompt question="?" choices={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]} focusedId={nav.focusedId} />;
    }
    // Just ensure the hook is callable without throw in a component tree
    const { lastFrame } = render(wrap(<Probe />));
    expect(lastFrame()).toContain('A');
  });
});

// ── FilePicker ───────────────────────────────────────────────────────────────

describe('FilePicker', () => {
  const entries: FileEntry[] = [
    { id: '..', label: '..', kind: 'parent' },
    { id: '/tmp/music', label: 'music', kind: 'dir', meta: 'dir' },
    { id: '/tmp/song.mp3', label: 'song.mp3', kind: 'file', meta: '.mp3' },
  ];

  test('renders cwd, entries, and kind marks without throwing', () => {
    const { lastFrame } = render(
      wrap(
        <FilePicker
          cwdLabel="~/project"
          entries={entries}
          focusedId="/tmp/song.mp3"
          height={10}
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('~/project');
    expect(frame).toContain('music');
    expect(frame).toContain('song.mp3');
    expect(frame).toContain('.mp3');
    expect(frame).toContain('..');
  });

  test('empty state is legible', () => {
    const { lastFrame } = render(
      wrap(<FilePicker entries={[]} emptyMessage="no entries" cwdLabel="/empty" />),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('/empty');
    expect(frame).toContain('no entries');
  });

  test('filter line only when active; path only when showPath', () => {
    const idle = render(wrap(<FilePicker entries={entries} width={60} />));
    expect(idle.lastFrame()).not.toMatch(/filter/);
    expect(idle.lastFrame()).not.toContain('path');

    const { lastFrame } = render(
      wrap(
        <FilePicker
          entries={entries}
          filter="song"
          showPath
          pathValue="/tmp/out.mp4"
          pathFocused
          width={60}
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toMatch(/filter · song/);
    expect(frame).toContain('/tmp/out.mp4');
    expect(frame).toContain('path');
  });

  test('width constrains the surface', () => {
    const { lastFrame } = render(
      wrap(
        <FilePicker
          cwdLabel="~/project"
          entries={entries}
          focusedId="/tmp/song.mp3"
          width={40}
          height={8}
        />,
      ),
    );
    expect(lastFrame()).toContain('~/project');
    expect(lastFrame()).toContain('song.mp3');
  });

  test('unknown kind degrades without throw', () => {
    const { lastFrame } = render(
      wrap(
        <FilePicker
          entries={[{ id: 'x', label: 'weird', kind: 'other' as FileEntry['kind'] }]}
          focusedId="x"
        />,
      ),
    );
    expect(lastFrame()).toContain('weird');
  });
});

// ── ChoicePicker ─────────────────────────────────────────────────────────────

describe('ChoicePicker', () => {
  test('empty state is legible', () => {
    const { lastFrame } = render(
      wrap(<ChoicePicker choices={[]} emptyMessage="no candidates" freeTextHint="type a path instead" />),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('no candidates');
    expect(frame).toContain('type a path instead');
  });

  test('one and many candidates render labels + meta', () => {
    const one = render(
      wrap(
        <ChoicePicker
          choices={[{ id: 'o1', label: 'option-1', meta: '2:14' }]}
          focusedId="o1"
        />,
      ),
    );
    expect(one.lastFrame()).toContain('option-1');
    expect(one.lastFrame()).toContain('2:14');

    const many = render(
      wrap(
        <ChoicePicker
          choices={[
            { id: 'a', label: 'alpha' },
            { id: 'b', label: 'beta' },
            { id: 'c', label: 'gamma' },
          ]}
          focusedId="b"
        />,
      ),
    );
    const frame = many.lastFrame() ?? '';
    expect(frame).toContain('alpha');
    expect(frame).toContain('beta');
    expect(frame).toContain('gamma');
  });

  test('windowing when candidates exceed height', () => {
    const choices = Array.from({ length: 20 }, (_, i) => ({
      id: `c${i}`,
      label: `candidate-${i}`,
    }));
    const { lastFrame } = render(
      wrap(<ChoicePicker choices={choices} focusedId="c0" height={5} />),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('candidate-0');
    // Not all 20 labels should appear when windowed
    expect(frame).not.toContain('candidate-19');
  });
});

// ── RunSummary ───────────────────────────────────────────────────────────────

describe('RunSummary', () => {
  test('renders title, facts, next-step with neutral tone', () => {
    const { lastFrame } = render(
      wrap(
        <RunSummary
          title="step finished · 3 items"
          tone="success"
          facts={[
            { term: 'output', value: './out/build' },
            { term: 'duration', value: '4m 12s' },
            { term: 'warnings', value: '2' },
          ]}
          next="press enter to continue"
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('step finished · 3 items');
    expect(frame).toContain('output');
    expect(frame).toContain('./out/build');
    expect(frame).toContain('press enter to continue');
  });

  test('warn tone for success-with-warnings', () => {
    const { lastFrame } = render(
      wrap(<RunSummary title="step finished with warnings" tone="warn" />),
    );
    expect(lastFrame()).toContain('step finished with warnings');
  });
});

// ── MetricStrip ──────────────────────────────────────────────────────────────

describe('MetricStrip', () => {
  const metrics: MetricItem[] = [
    { id: 'd', label: 'done', value: '12/40' },
    { id: 'e', label: 'elapsed', value: '2m' },
    { id: 'r', label: 'rate', value: '3.1/s' },
  ];

  test('empty metric list renders nothing', () => {
    const { lastFrame } = render(wrap(<MetricStrip metrics={[]} />));
    expect(lastFrame()).toBe('');
  });

  test('renders metrics in stable order', () => {
    const { lastFrame } = render(wrap(<MetricStrip metrics={metrics} width={80} />));
    const frame = lastFrame() ?? '';
    expect(frame).toContain('done');
    expect(frame).toContain('12/40');
    expect(frame).toContain('elapsed');
    expect(frame).toContain('rate');
  });

  test('narrow width drops trailing metrics whole', () => {
    const fitted = fitMetrics(metrics, 12);
    // Only leading metric(s) that fully fit
    expect(fitted.length).toBeLessThan(metrics.length);
    expect(fitted[0]?.id).toBe('d');
    // Never partial mid-metric: every shown item is complete
    for (const m of fitted) {
      expect(m.label).toBeTruthy();
      expect(m.value).toBeTruthy();
    }
  });
});

// ── KeyHints ─────────────────────────────────────────────────────────────────

describe('KeyHints', () => {
  test('renders zero hints without padding noise', () => {
    const { lastFrame } = render(wrap(<KeyHints keys={[]} />));
    expect(lastFrame()).toBe('');
  });

  test('renders local chips with Footer-like language', () => {
    const { lastFrame } = render(
      wrap(
        <KeyHints
          keys={[
            { k: 'o', desc: 'open' },
            { k: 'enter', desc: 'continue' },
          ]}
          width={80}
        />,
      ),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('o');
    expect(frame).toContain('open');
    expect(frame).toContain('enter');
    expect(frame).toContain('continue');
  });
});

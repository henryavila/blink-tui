import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import {
  Footer,
  packFooterRows,
  packFooterColumns,
  type HotkeyDef,
} from '../src/components/Footer.js';

test('footer renders hotkeys, descriptions, and the right slot', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Footer
        keys={[
          { k: 'tab', desc: 'switch pane' },
          { k: 'q', desc: 'quit' },
        ]}
        right={'6 of 8'}
      />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('tab');
  expect(frame).toContain('switch pane');
  expect(frame).toContain('q');
  expect(frame).toContain('quit');
  expect(frame).toContain('6 of 8');
});

test('footer omits the right slot when not provided', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Footer keys={[{ k: 'enter', desc: 'open' }]} />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('enter');
  expect(frame).toContain('open');
});

test('footer is single-line when chips fit under the ascii icon set', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="ascii">
      <Footer keys={[{ k: '/', desc: 'search' }]} right={'1 of 1'} />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('/');
  expect(frame).toContain('search');
  expect(frame).toContain('1 of 1');
  // hotkey bar is one cell tall when content fits — no wrap onto a second row.
  // (The house top-margin adds a blank line above it, so count only content rows.)
  expect(frame.split('\n').filter((l) => l.trim() !== '')).toHaveLength(1);
});

test('packFooterRows keeps one row when everything fits', () => {
  const keys: HotkeyDef[] = [
    { k: 't', desc: 'thread' },
    { k: 'n', desc: 'now' },
    { k: 'q', desc: 'quit' },
  ];
  // Generous budget
  expect(packFooterRows(keys, 80, 2)).toEqual([keys]);
});

test('packFooterRows wraps to a second row before dropping', () => {
  // Each chip is ~ " k " + " verylonglabel" → force wrap on a tight budget.
  const keys: HotkeyDef[] = [
    { k: 'a', desc: 'alphaaa' }, // 1+2+7+1 = 11
    { k: 'b', desc: 'betabbb' }, // +3+11 = 14 → cumulative
    { k: 'c', desc: 'gammagg' },
    { k: 'd', desc: 'deltadd' },
  ];
  // Budget 24: first two chips ≈ 11+3+11 = 25 → only one per first math; use 26
  // chipWidth: k(1)+2+desc(7)+1 = 11; gap 3
  // budget 20 → row1: one chip (11), maybe second 11+3+11=25 > 20 → only a
  // Actually with first-chip force: a fits, b doesn't (11+3+11=25>20) → [a]
  // row2: b, c? 11+3+11=25>20 → [b] then need row3 but maxRows=2 so drop c,d
  const tight = packFooterRows(keys, 20, 2);
  expect(tight).toHaveLength(2);
  expect(tight[0]!.map((h) => h.k)).toEqual(['a']);
  expect(tight[1]!.map((h) => h.k)).toEqual(['b']);

  // Wider budget packs two per row
  const mid = packFooterRows(keys, 28, 2);
  // 11+3+11=25 <= 28; +3+11=39 > 28 → [a,b] then [c,d]
  expect(mid).toEqual([
    [keys[0], keys[1]],
    [keys[2], keys[3]],
  ]);
});

test('packFooterRows drops overflow past maxRows', () => {
  const keys: HotkeyDef[] = Array.from({ length: 6 }, (_, i) => ({
    k: String(i),
    desc: 'xxxxxx', // 1+2+6+1 = 10
  }));
  // budget 10 → one chip/row; maxRows 2 → only first two keys
  const packed = packFooterRows(keys, 10, 2);
  expect(packed).toHaveLength(2);
  expect(packed.flat().map((h) => h.k)).toEqual(['0', '1']);
});

test('footer with many keys still shows late chips via second bar', () => {
  // Default columns in CI is ~80. Build keys that exceed one row but fit in two.
  const keys: HotkeyDef[] = [
    { k: 't', desc: 'thread' },
    { k: 'n', desc: 'now' },
    { k: 'w', desc: 'wait' },
    { k: 'v', desc: 'todo' },
    { k: 's', desc: 'status' },
    { k: 'sp', desc: 'toggle' },
    { k: 'd', desc: 'del' },
    { k: 'f', desc: 'finished' },
    { k: 'c', desc: 'clear' },
    { k: ',', desc: 'pack' },
    { k: '?', desc: 'help' },
    { k: 'q', desc: 'quit' },
  ];
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Footer keys={keys} right="2 open · ai-dev" maxRows={2} />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  // Late chips that used to drop on a single bar should appear with maxRows=2.
  expect(frame).toContain('clear');
  expect(frame).toContain('help');
  expect(frame).toContain('quit');
  expect(frame).toContain('finished');
});

test('packFooterColumns balances into equal columns with per-column pads', () => {
  // chipWidth ≈ 11 each; gap 3 → two chips = 25, three = 39
  const keys: HotkeyDef[] = [
    { k: 'a', desc: 'alphaaa' },
    { k: 'b', desc: 'betabbb' },
    { k: 'c', desc: 'gammagg' },
    { k: 'd', desc: 'deltadd' },
  ];
  // Budget 28: natural two per row; multi-row → [[a,b],[c,d]]
  const packed = packFooterColumns(keys, 28, 2);
  expect(packed.rows).toEqual([
    [keys[0], keys[1]],
    [keys[2], keys[3]],
  ]);
  // Same column count per full row → vertical alignment
  expect(packed.rows[0]!.length).toBe(packed.rows[1]!.length);
  // Per-column widths equal chip width (all same length)
  expect(packed.colWidths).toEqual([11, 11]);
});

test('packFooterColumns drops overflow past maxRows capacity', () => {
  const keys: HotkeyDef[] = Array.from({ length: 6 }, (_, i) => ({
    k: String(i),
    desc: 'xxxxxx', // width 10
  }));
  // budget 10 → one chip/row greedy; maxRows 2 → only 0,1
  const packed = packFooterColumns(keys, 10, 2);
  expect(packed.rows.flat().map((h) => h.k)).toEqual(['0', '1']);
});

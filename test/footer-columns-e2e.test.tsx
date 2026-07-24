/**
 * E2E (render-level) contract: multi-row Footer columns stay vertically aligned
 * for EVERY column — not just the first chip on each row (which always shares
 * the left edge pad even with greedy packing / dropped pads).
 */
import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import {
  Footer,
  packFooterColumns,
  columnStartOffset,
  keyChipWidth,
  descChipWidth,
  chipWidth,
  type HotkeyDef,
} from '../src/components/Footer.js';

/** mn-like key set — short and long labels mixed, multi-char key `sp`. */
const MN_KEYS: HotkeyDef[] = [
  { k: 't', desc: 'thread' },
  { k: 'd', desc: 'desc' },
  { k: 'n', desc: 'now' },
  { k: 'v', desc: 'todo' },
  { k: 's', desc: 'status' },
  { k: 'sp', desc: 'toggle' },
  { k: 'f', desc: 'finish' },
  { k: 'c', desc: 'clear' },
  { k: ',', desc: 'pack' },
  { k: '?', desc: 'help' },
  { k: 'q', desc: 'quit' },
];

const RIGHT = '0 open · ai-dev';

/**
 * Find inverse-key chip starts on a line for a known ordered key list.
 * Uses the catalog order of `keys` (the chips we expect on this row) and
 * advances the scan cursor so a desc equal to a key glyph cannot be re-matched
 * (e.g. key `c` with desc `c` → `" c  c"`).
 */
function keyPositionsForRow(line: string, keys: HotkeyDef[]): number[] {
  const positions: number[] = [];
  let from = 0;
  for (const h of keys) {
    const pat = ' ' + h.k + ' ';
    const idx = line.indexOf(pat, from);
    positions.push(idx);
    if (idx >= 0) from = idx + pat.length;
  }
  return positions;
}

/**
 * Infer which keys landed on each rendered row by matching the pack order
 * against the frame (left→right unique hits, longer keys first at each index).
 */
function splitKeysAcrossLines(
  lines: string[],
  catalog: HotkeyDef[],
): HotkeyDef[][] {
  // Greedy: walk catalog in order; assign each key to the first line that
  // still has an unmatched ` k ` after previously consumed keys on that line.
  const cursors = lines.map(() => 0);
  const rows: HotkeyDef[][] = lines.map(() => []);

  for (const h of catalog) {
    const pat = ' ' + h.k + ' ';
    let placed = false;
    for (let li = 0; li < lines.length; li++) {
      const idx = lines[li]!.indexOf(pat, cursors[li]);
      if (idx < 0) continue;
      rows[li]!.push(h);
      cursors[li] = idx + pat.length;
      placed = true;
      break;
    }
    if (!placed) {
      // dropped by Footer packing — stop (later keys also dropped)
      break;
    }
  }
  return rows.filter((r) => r.length > 0);
}

test('packFooterColumns: math start offsets match for every column across rows', () => {
  const budget = 62;
  const packed = packFooterColumns(MN_KEYS, budget, 2);
  expect(packed.rows.length).toBe(2);
  expect(packed.keySlot).toBeGreaterThan(0);
  expect(packed.descSlots.length).toBeGreaterThan(0);

  const cols = packed.descSlots.length;
  expect(packed.rows[0]!.length).toBe(cols);

  const row0 = packed.rows[0]!;
  const row1 = packed.rows[1]!;
  const shared = Math.min(row0.length, row1.length);
  expect(shared).toBeGreaterThan(1);

  for (let c = 0; c < shared; c++) {
    const start = columnStartOffset(c, packed.keySlot, packed.descSlots);
    expect(keyChipWidth(row0[c]!) + descChipWidth(row0[c]!)).toBeLessThanOrEqual(
      packed.keySlot + packed.descSlots[c]!,
    );
    expect(keyChipWidth(row1[c]!) + descChipWidth(row1[c]!)).toBeLessThanOrEqual(
      packed.keySlot + packed.descSlots[c]!,
    );
    expect(columnStartOffset(c, packed.keySlot, packed.descSlots)).toBe(start);
  }
});

test('e2e render: every column’s key starts at the same cell on both rows', () => {
  // Uneven desc lengths — misalignment is obvious if column pads are dropped.
  const keys: HotkeyDef[] = [
    { k: 'a', desc: 'alpha' },
    { k: 'b', desc: 'beta-LONG' },
    { k: 'c', desc: 'cx' }, // not equal to key (avoids ambiguous scan)
    { k: 'd', desc: 'delta' },
    { k: 'e', desc: 'echooooo' },
    { k: 'f', desc: 'fo' },
    { k: 'g', desc: 'gamma' },
    { k: 'h', desc: 'hi' },
  ];

  expect(keys.reduce((n, h, i) => n + (i ? 3 : 0) + chipWidth(h), 0)).toBeGreaterThan(70);

  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Footer keys={keys} right={RIGHT} maxRows={2} marginTop={0} align="columns" />
    </ThemeProvider>,
  );

  const lines = (lastFrame() ?? '').split('\n').filter((l) => l.trim() !== '');
  expect(lines.length).toBeGreaterThanOrEqual(2);

  const rowKeys = splitKeysAcrossLines(lines, keys);
  expect(rowKeys.length).toBe(2);
  expect(rowKeys[0]!.length).toBeGreaterThan(1);
  expect(rowKeys[1]!.length).toBeGreaterThan(0);

  const pos0 = keyPositionsForRow(lines[0]!, rowKeys[0]!);
  const pos1 = keyPositionsForRow(lines[1]!, rowKeys[1]!);
  const shared = Math.min(pos0.length, pos1.length);
  expect(shared).toBeGreaterThan(1);

  for (let c = 0; c < shared; c++) {
    expect(pos0[c]).toBeGreaterThanOrEqual(0);
    expect(pos1[c]).toBeGreaterThanOrEqual(0);
    expect(
      pos0[c],
      `col ${c}: row0 ${rowKeys[0]![c]!.k}@${pos0[c]} vs row1 ${rowKeys[1]![c]!.k}@${pos1[c]}\n${lines[0]}\n${lines[1]}`,
    ).toBe(pos1[c]);
  }
});

test('e2e render: mn key set — columns 1..n align (not only col 0)', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Footer keys={MN_KEYS} right={RIGHT} maxRows={2} marginTop={0} align="columns" />
    </ThemeProvider>,
  );

  const lines = (lastFrame() ?? '').split('\n').filter((l) => l.trim() !== '');
  expect(lines.length).toBeGreaterThanOrEqual(2);

  const rowKeys = splitKeysAcrossLines(lines, MN_KEYS);
  expect(rowKeys.length).toBe(2);

  const pos0 = keyPositionsForRow(lines[0]!, rowKeys[0]!);
  const pos1 = keyPositionsForRow(lines[1]!, rowKeys[1]!);
  const shared = Math.min(pos0.length, pos1.length);
  expect(shared).toBeGreaterThan(1);

  const mismatches: string[] = [];
  for (let c = 0; c < shared; c++) {
    if (pos0[c] !== pos1[c] || pos0[c]! < 0 || pos1[c]! < 0) {
      mismatches.push(
        `col${c} ${rowKeys[0]![c]!.k}@${pos0[c]} vs ${rowKeys[1]![c]!.k}@${pos1[c]}`,
      );
    }
  }
  expect(
    mismatches,
    `alignment failures:\n${mismatches.join('\n')}\n${lines[0]}\n${lines[1]}`,
  ).toEqual([]);
});

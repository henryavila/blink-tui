import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useStdoutDimensions } from '../hooks/useStdoutDimensions.js';
import { cellWidth } from '../textWidth.js';

/** One hotkey: a key chip plus its terse description. */
export interface HotkeyDef {
  /** The key, lowercased: `'tab'`, `'enter'`, `'q'`, `'/'`, `'?'`. */
  k: string;
  /** Terse lowercase label for what the key does (`'switch pane'`). */
  desc: string;
}

export interface FooterProps {
  /** Hotkeys, laid left-to-right with a 3-cell gap between them. */
  keys?: HotkeyDef[];
  /** Optional status node, flush-right in faint text (e.g. `'6 of 8'`). */
  right?: React.ReactNode;
  /**
   * Cells of breathing room above the bar. House default is `1` so the footer
   * never butts up against the content above it; pass `0` to pin it flush.
   */
  marginTop?: number;
  /**
   * Max sunken bars when chips overflow one line. Default **2**: one row when
   * everything fits; a second bar only if needed. Whole chips still drop from
   * the end if they don't fit in `maxRows` (never mid-word clip).
   */
  maxRows?: number;
  /**
   * Multi-row packing strategy.
   * - `'flow'`: greedy left→right, variable widths (no cross-row alignment).
   * - `'columns'` (default): when the bar wraps, chips form vertical columns
   *   (each column padded to the widest chip in that column).
   */
  align?: 'flow' | 'columns';
}

const CHIP_GAP = 3;

/**
 * A single hotkey: the key in inverse video (the design's "active chip"),
 * padded one cell each side, then the description in muted text. One line.
 */
function Hotkey({ k, desc }: HotkeyDef): React.ReactElement {
  const tokens = useTokens();
  return (
    <Box flexShrink={0}>
      <Text color={tokens.fgInverse} backgroundColor={tokens.bgInverse} wrap="truncate">
        {' ' + k + ' '}
      </Text>
      <Text color={tokens.fgMuted} backgroundColor={tokens.bgSunken} wrap="truncate">
        {' ' + desc}
      </Text>
    </Box>
  );
}

/** Rendered width of one chip: ` k ` (key + 2 pad) then ` desc` (desc + 1 gap). */
function chipWidth(h: HotkeyDef): number {
  return cellWidth(h.k) + 2 + cellWidth(h.desc) + 1;
}

/** Width of a packed row including gaps between chips (natural chip widths). */
function rowUsed(row: HotkeyDef[]): number {
  if (row.length === 0) return 0;
  let used = 0;
  for (let i = 0; i < row.length; i++) {
    used += (i > 0 ? CHIP_GAP : 0) + chipWidth(row[i]!);
  }
  return used;
}

/** Width of a row given per-column slot widths (missing trailing cols ignored). */
function rowUsedColWidths(count: number, colWidths: number[]): number {
  if (count <= 0) return 0;
  let used = 0;
  for (let i = 0; i < count; i++) {
    used += (i > 0 ? CHIP_GAP : 0) + (colWidths[i] ?? 0);
  }
  return used;
}

/**
 * Pack keys into up to `maxRows` rows for a given cell budget (greedy flow).
 * Fills each row left→right; overflow starts the next row.
 * Chips that still don't fit after the last row are dropped.
 */
export function packFooterRows(
  keys: HotkeyDef[],
  budget: number,
  maxRows: number,
): HotkeyDef[][] {
  const rows = Math.max(1, Math.floor(maxRows));
  if (keys.length === 0 || budget <= 0) return [];

  // Fast path: everything on one row.
  if (rowUsed(keys) <= budget) return [keys];

  const out: HotkeyDef[][] = [];
  let i = 0;
  while (i < keys.length && out.length < rows) {
    const row: HotkeyDef[] = [];
    let used = 0;
    while (i < keys.length) {
      const h = keys[i]!;
      const w = (row.length > 0 ? CHIP_GAP : 0) + chipWidth(h);
      if (row.length === 0) {
        // Always place at least one chip so a single oversized label still shows.
        row.push(h);
        used = chipWidth(h);
        i++;
        if (used > budget) break;
        continue;
      }
      if (used + w > budget) break;
      row.push(h);
      used += w;
      i++;
    }
    out.push(row);
  }
  return out;
}

export interface ColumnPack {
  rows: HotkeyDef[][];
  /** Per-column cell widths; empty when single-row / no padding. */
  colWidths: number[];
}

/**
 * Column-aligned packing for multi-row footers.
 *
 * 1. Greedy-fit which keys fit under `budget` × `maxRows` (same capacity as flow).
 * 2. Re-slice those keys into equal-width columns so chip *i* on each row lines up.
 * 3. Each column pads to the max natural chip width in that column (dense + aligned).
 */
export function packFooterColumns(
  keys: HotkeyDef[],
  budget: number,
  maxRows: number,
): ColumnPack {
  const rowCap = Math.max(1, Math.floor(maxRows));
  if (keys.length === 0 || budget <= 0) return { rows: [], colWidths: [] };

  // Single row with natural widths — denser, no pad needed.
  if (rowUsed(keys) <= budget) return { rows: [keys], colWidths: [] };

  // Phase 1: capacity under natural greedy (what would fit without alignment).
  const greedy = packFooterRows(keys, budget, rowCap);
  let shown = greedy.flat();
  if (shown.length === 0) return { rows: [], colWidths: [] };
  if (greedy.length <= 1) return { rows: greedy, colWidths: [] };

  // Phase 2: column count — prefer filling maxRows evenly.
  // Start from ceil(n / maxRows) and grow while a natural-width row still fits.
  let cols = Math.max(1, Math.ceil(shown.length / rowCap));
  // Cap cols by what a natural-width row of that many of the widest chips can hold.
  while (cols > 1) {
    // Probe: can we fit `cols` chips using the widest `cols` chips as upper bound?
    const probe = [...shown].sort((a, b) => chipWidth(b) - chipWidth(a)).slice(0, cols);
    if (rowUsed(probe) <= budget) break;
    cols--;
  }

  // Re-slice shown into row-major grid; drop any that don't fit after cols shrink.
  const capacity = cols * rowCap;
  shown = shown.slice(0, capacity);
  // If we shrank cols, we may have more shown than capacity — already sliced.
  // If greedy had more keys than capacity after cols shrink, drop tail.
  // Also: if shown is shorter, ok.

  // Rebuild from original key order limited to capacity (priority = order).
  shown = keys.slice(0, Math.min(keys.length, capacity));
  // Ensure even this set fits under natural greedy with new cols — may need to drop more.
  // Validate each full row of `cols` fits; if not, reduce shown.
  while (shown.length > 0) {
    const testRows: HotkeyDef[][] = [];
    for (let i = 0; i < shown.length; i += cols) {
      testRows.push(shown.slice(i, i + cols));
    }
    const ok = testRows.every((r) => rowUsed(r) <= budget);
    if (ok) break;
    shown = shown.slice(0, shown.length - 1);
  }

  const rows: HotkeyDef[][] = [];
  for (let i = 0; i < shown.length; i += cols) {
    rows.push(shown.slice(i, i + cols));
  }

  // Per-column slot = max natural width in that column.
  const colWidths: number[] = [];
  for (let c = 0; c < cols; c++) {
    let m = 0;
    for (const row of rows) {
      const h = row[c];
      if (h) m = Math.max(m, chipWidth(h));
    }
    colWidths.push(m);
  }

  // If padded columns exceed budget (rare: padding only grows), drop last chips.
  while (rows.length > 0 && rowUsedColWidths(rows[0]!.length, colWidths) > budget) {
    // Drop last chip overall
    const lastRow = rows[rows.length - 1]!;
    lastRow.pop();
    if (lastRow.length === 0) rows.pop();
    // Recompute colWidths
    const newCols = Math.max(0, ...rows.map((r) => r.length));
    colWidths.length = 0;
    for (let c = 0; c < newCols; c++) {
      let m = 0;
      for (const row of rows) {
        const h = row[c];
        if (h) m = Math.max(m, chipWidth(h));
      }
      colWidths.push(m);
    }
  }

  return { rows, colWidths };
}

/** Drop trailing chips on a row until natural widths fit in budget. */
function trimRowForRight(row: HotkeyDef[], budget: number): HotkeyDef[] {
  if (row.length === 0) return row;
  const kept: HotkeyDef[] = [];
  let used = 0;
  for (const h of row) {
    const w = (kept.length > 0 ? CHIP_GAP : 0) + chipWidth(h);
    if (kept.length > 0 && used + w > budget) break;
    if (kept.length === 0 && w > budget) {
      kept.push(h);
      break;
    }
    kept.push(h);
    used += w;
  }
  return kept;
}

function FooterRow({
  keys,
  rightStr,
  columns,
  colWidths,
}: {
  keys: HotkeyDef[];
  rightStr: string | null;
  columns: number;
  /** Per-column widths; empty = natural. */
  colWidths: number[];
}): React.ReactElement {
  const tokens = useTokens();
  const rightWidth = rightStr != null ? cellWidth(rightStr) : 0;
  const used =
    colWidths.length > 0
      ? rowUsedColWidths(keys.length, colWidths)
      : rowUsed(keys);
  // pad 1 left + 1 right; optional right status + 1-cell gap before it
  const fill = ' '.repeat(
    Math.max(0, columns - 1 - used - (rightWidth > 0 ? rightWidth + 1 : 0) - 1),
  );

  return (
    <Box flexShrink={0}>
      <Text backgroundColor={tokens.bgSunken} wrap="truncate">
        {' '}
        {keys.map((h, i) => {
          const natural = chipWidth(h);
          const slot = colWidths[i] ?? 0;
          const pad = slot > natural ? ' '.repeat(slot - natural) : '';
          return (
            <Text key={i}>
              {i > 0 ? '   ' : ''}
              <Text color={tokens.fgInverse} backgroundColor={tokens.bgInverse}>
                {' ' + h.k + ' '}
              </Text>
              <Text color={tokens.fgMuted}>{' ' + h.desc}</Text>
              {pad}
            </Text>
          );
        })}
        {fill}
        {rightStr != null ? <Text color={tokens.fgFaint}>{rightStr}</Text> : null}
        {' '}
      </Text>
    </Box>
  );
}

/**
 * The always-visible hotkey bar pinned to the bottom. A sunken-fill strip:
 * hotkeys flush-left (3-cell gaps), optional status flush-right in faint text.
 *
 * **Narrow terminals:** chips pack into up to {@link FooterProps.maxRows}
 * bars (default 2) before any whole chip is dropped. With default
 * `align="columns"`, wrapped rows use fixed per-column slots so shortcuts
 * stay vertically aligned on small screens.
 *
 * When chips still don't fit, whole chips drop from the right rather than
 * clipping mid-word. Apps should order `keys` by importance.
 *
 * Ink's `<Box>` has no fill (only `<Text>` takes `backgroundColor`), and a
 * terminal cell can't layer — every cell is one glyph with one fg + one bg. So
 * the solid sunken bar is built by making the *gaps and padding themselves*
 * background-carrying spaces inside a single `<Text>`, with the inverse key
 * chips nested as `<Text>` that override the bg.
 *
 * A measurable (string) `right` is flush-right with an exact space fill on the
 * **last** row. An unmeasurable React-node `right` falls back to flex layout
 * (middle gap unfilled).
 */
export function Footer({
  keys = [],
  right,
  marginTop = 1,
  maxRows = 2,
  align = 'columns',
}: FooterProps): React.ReactElement {
  const tokens = useTokens();
  const { columns } = useStdoutDimensions();

  const rightStr = typeof right === 'string' ? right : null;
  const rightWidth = rightStr != null ? cellWidth(rightStr) : 0;
  // Reserve right status for packing so multi-row columns stay aligned and the
  // last row does not need to drop chips for the status.
  const packBudget = Math.max(
    0,
    columns - 2 - (rightWidth > 0 ? rightWidth + 1 : 0),
  );
  const fullBudget = Math.max(0, columns - 2);
  const budget = rightWidth > 0 ? packBudget : fullBudget;

  let rows: HotkeyDef[][];
  let colWidths: number[] = [];

  if (align === 'flow') {
    rows = packFooterRows(keys, budget, maxRows);
    if (rightStr != null && rows.length > 0) {
      const last = rows.length - 1;
      rows = rows.map((r, i) => (i === last ? trimRowForRight(r, packBudget) : r));
    }
  } else {
    const packed = packFooterColumns(keys, budget, maxRows);
    rows = packed.rows;
    colWidths = packed.colWidths;
  }

  if (rows.length === 0) rows = [[]];

  // Node `right`: can't measure it — flex layout, multi-row stack of chips + status.
  if (right != null && rightStr == null) {
    return (
      <Box flexDirection="column" marginTop={marginTop} flexShrink={0}>
        {rows.map((row, ri) => (
          <Box
            key={ri}
            flexDirection="row"
            paddingX={1}
            justifyContent={ri === rows.length - 1 ? 'space-between' : 'flex-start'}
            flexShrink={0}
          >
            <Box flexDirection="row" gap={CHIP_GAP} flexShrink={1} overflow="hidden">
              {row.map((h, i) => (
                <Hotkey key={i} k={h.k} desc={h.desc} />
              ))}
            </Box>
            {ri === rows.length - 1 ? (
              <Box flexShrink={0}>
                <Text color={tokens.fgFaint} backgroundColor={tokens.bgSunken} wrap="truncate">
                  {right}
                </Text>
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={marginTop} flexShrink={0}>
      {rows.map((row, ri) => (
        <FooterRow
          key={ri}
          keys={row}
          rightStr={ri === rows.length - 1 ? rightStr : null}
          columns={columns}
          colWidths={colWidths}
        />
      ))}
    </Box>
  );
}

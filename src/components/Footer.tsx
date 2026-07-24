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
   *   (fixed key slot + per-column desc pad so every column lines up).
   */
  align?: 'flow' | 'columns';
}

const CHIP_GAP = 3;
/** Leading/trailing sunken pad on each FooterRow. */
const ROW_EDGE = 1;

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

/** Natural width of the inverse key chip: ` k ` (key + 2 pad). */
export function keyChipWidth(h: HotkeyDef): number {
  return cellWidth(h.k) + 2;
}

/** Natural width of the muted desc part: ` desc` (leading space + text). */
export function descChipWidth(h: HotkeyDef): number {
  return cellWidth(h.desc) + 1;
}

/** Full natural chip width: key chip + desc part. */
export function chipWidth(h: HotkeyDef): number {
  return keyChipWidth(h) + descChipWidth(h);
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
  /**
   * Shared inverse-key slot width (max key chip across all shown keys).
   * 0 when not column-aligning (single row / flow).
   */
  keySlot: number;
  /**
   * Per-column desc slot widths (max desc part in that column).
   * Empty when not column-aligning.
   */
  descSlots: number[];
}

/** Full slot width for column c: keySlot + descSlots[c]. */
export function columnSlotWidth(keySlot: number, descSlots: number[], col: number): number {
  return keySlot + (descSlots[col] ?? 0);
}

/** Total row width for `count` columns with shared key slot + per-col desc slots. */
export function rowUsedAligned(
  count: number,
  keySlot: number,
  descSlots: number[],
): number {
  if (count <= 0) return 0;
  let used = 0;
  for (let i = 0; i < count; i++) {
    used += (i > 0 ? CHIP_GAP : 0) + columnSlotWidth(keySlot, descSlots, i);
  }
  return used;
}

/**
 * Absolute cell index (0-based within the row content after the leading edge
 * pad is applied by the caller) where column `col` starts, given aligned slots.
 */
export function columnStartOffset(
  col: number,
  keySlot: number,
  descSlots: number[],
): number {
  let x = 0;
  for (let i = 0; i < col; i++) {
    x += columnSlotWidth(keySlot, descSlots, i) + CHIP_GAP;
  }
  return x;
}

/**
 * Column-aligned packing for multi-row footers.
 *
 * 1. Greedy-fit which keys fit under `budget` × `maxRows`.
 * 2. Re-slice into a grid with equal column counts across full rows.
 * 3. `keySlot` = max inverse-key width (so blue chips share one width).
 * 4. `descSlots[c]` = max desc width in column c (so labels pad to a column).
 */
export function packFooterColumns(
  keys: HotkeyDef[],
  budget: number,
  maxRows: number,
): ColumnPack {
  const rowCap = Math.max(1, Math.floor(maxRows));
  if (keys.length === 0 || budget <= 0) {
    return { rows: [], keySlot: 0, descSlots: [] };
  }

  // Single row with natural widths — denser, no pad needed.
  if (rowUsed(keys) <= budget) {
    return { rows: [keys], keySlot: 0, descSlots: [] };
  }

  // Phase 1: capacity under natural greedy.
  const greedy = packFooterRows(keys, budget, rowCap);
  let shown = greedy.flat();
  if (shown.length === 0) return { rows: [], keySlot: 0, descSlots: [] };
  if (greedy.length <= 1) {
    return { rows: greedy, keySlot: 0, descSlots: [] };
  }

  // Phase 2: column count — prefer filling maxRows evenly.
  let cols = Math.max(1, Math.ceil(shown.length / rowCap));
  while (cols > 1) {
    const probe = [...shown].sort((a, b) => chipWidth(b) - chipWidth(a)).slice(0, cols);
    if (rowUsed(probe) <= budget) break;
    cols--;
  }

  const capacity = cols * rowCap;
  shown = keys.slice(0, Math.min(keys.length, capacity));

  // Drop trailing chips until every partial/full row fits naturally.
  while (shown.length > 0) {
    const testRows: HotkeyDef[][] = [];
    for (let i = 0; i < shown.length; i += cols) {
      testRows.push(shown.slice(i, i + cols));
    }
    if (testRows.every((r) => rowUsed(r) <= budget)) break;
    shown = shown.slice(0, shown.length - 1);
  }

  const rows: HotkeyDef[][] = [];
  for (let i = 0; i < shown.length; i += cols) {
    rows.push(shown.slice(i, i + cols));
  }
  if (rows.length === 0) return { rows: [], keySlot: 0, descSlots: [] };

  const keySlot = Math.max(...shown.map(keyChipWidth));
  const descSlots: number[] = [];
  for (let c = 0; c < cols; c++) {
    let m = 0;
    for (const row of rows) {
      const h = row[c];
      if (h) m = Math.max(m, descChipWidth(h));
    }
    descSlots.push(m);
  }

  // If aligned width exceeds budget, drop last chips until it fits.
  while (rows.length > 0) {
    const n = Math.max(...rows.map((r) => r.length));
    if (rowUsedAligned(n, keySlot, descSlots) <= budget) break;
    const lastRow = rows[rows.length - 1]!;
    lastRow.pop();
    if (lastRow.length === 0) rows.pop();
    // recompute descSlots for remaining
    const newCols = Math.max(0, ...rows.map((r) => r.length));
    descSlots.length = 0;
    for (let c = 0; c < newCols; c++) {
      let m = 0;
      for (const row of rows) {
        const h = row[c];
        if (h) m = Math.max(m, descChipWidth(h));
      }
      descSlots.push(m);
    }
  }

  return { rows, keySlot, descSlots };
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

/**
 * Build one sunken footer row as a flat sequence of Text nodes so padding
 * spaces always carry bgSunken (Ink can drop bare string pads between nested
 * Text nodes — that was why only column 0 looked aligned).
 */
function FooterRow({
  keys,
  rightStr,
  columns,
  keySlot,
  descSlots,
}: {
  keys: HotkeyDef[];
  rightStr: string | null;
  columns: number;
  keySlot: number;
  descSlots: number[];
}): React.ReactElement {
  const tokens = useTokens();
  const aligned = keySlot > 0 && descSlots.length > 0;
  const rightWidth = rightStr != null ? cellWidth(rightStr) : 0;

  const used = aligned
    ? rowUsedAligned(keys.length, keySlot, descSlots)
    : rowUsed(keys);

  const fillLen = Math.max(
    0,
    columns - ROW_EDGE - used - (rightWidth > 0 ? rightWidth + 1 : 0) - ROW_EDGE,
  );

  const parts: React.ReactNode[] = [];
  parts.push(
    <Text key="edge-l" backgroundColor={tokens.bgSunken}>
      {' '}
    </Text>,
  );

  keys.forEach((h, i) => {
    if (i > 0) {
      parts.push(
        <Text key={`gap-${i}`} backgroundColor={tokens.bgSunken}>
          {'   '}
        </Text>,
      );
    }

    const kNatural = keyChipWidth(h);
    const dNatural = descChipWidth(h);
    const kPad = aligned ? Math.max(0, keySlot - kNatural) : 0;
    const dPad = aligned ? Math.max(0, (descSlots[i] ?? dNatural) - dNatural) : 0;

    // Inverse key chip + trailing pad inside the same styled run when possible.
    // Key pad (to shared keySlot) uses sunken bg after the inverse chip.
    parts.push(
      <Text
        key={`k-${i}`}
        color={tokens.fgInverse}
        backgroundColor={tokens.bgInverse}
      >
        {' ' + h.k + ' '}
      </Text>,
    );
    if (kPad > 0) {
      parts.push(
        <Text key={`kp-${i}`} backgroundColor={tokens.bgSunken}>
          {' '.repeat(kPad)}
        </Text>,
      );
    }
    // Desc + desc pad in one muted sunken Text — pad cannot be stripped.
    parts.push(
      <Text
        key={`d-${i}`}
        color={tokens.fgMuted}
        backgroundColor={tokens.bgSunken}
      >
        {' ' + h.desc + (dPad > 0 ? ' '.repeat(dPad) : '')}
      </Text>,
    );
  });

  if (fillLen > 0) {
    parts.push(
      <Text key="fill" backgroundColor={tokens.bgSunken}>
        {' '.repeat(fillLen)}
      </Text>,
    );
  }
  if (rightStr != null) {
    // one-cell gap before right status when there is fill or chips
    parts.push(
      <Text key="rgap" backgroundColor={tokens.bgSunken}>
        {' '}
      </Text>,
    );
    parts.push(
      <Text key="right" color={tokens.fgFaint} backgroundColor={tokens.bgSunken}>
        {rightStr}
      </Text>,
    );
  }
  parts.push(
    <Text key="edge-r" backgroundColor={tokens.bgSunken}>
      {' '}
    </Text>,
  );

  return (
    <Box flexShrink={0}>
      <Text backgroundColor={tokens.bgSunken} wrap="truncate">
        {parts}
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
 * `align="columns"`, wrapped rows use a shared key slot + per-column desc
 * slots so every column (not just the first) lines up across rows.
 *
 * When chips still don't fit, whole chips drop from the right rather than
 * clipping mid-word. Apps should order `keys` by importance.
 *
 * Ink's `<Box>` has no fill (only `<Text>` takes `backgroundColor`), and a
 * terminal cell can't layer — every cell is one glyph with one fg + one bg. So
 * the solid sunken bar is built by making the *gaps and padding themselves*
 * background-carrying spaces inside styled `<Text>` nodes.
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
  let keySlot = 0;
  let descSlots: number[] = [];

  if (align === 'flow') {
    rows = packFooterRows(keys, budget, maxRows);
    if (rightStr != null && rows.length > 0) {
      const last = rows.length - 1;
      rows = rows.map((r, i) => (i === last ? trimRowForRight(r, packBudget) : r));
    }
  } else {
    const packed = packFooterColumns(keys, budget, maxRows);
    rows = packed.rows;
    keySlot = packed.keySlot;
    descSlots = packed.descSlots;
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
          keySlot={keySlot}
          descSlots={descSlots}
        />
      ))}
    </Box>
  );
}

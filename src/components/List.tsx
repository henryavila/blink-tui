import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { cellWidth } from '../textWidth.js';
import { useListWindow } from '../hooks/useListWindow.js';

/**
 * One row's worth of data. `glyph` and `domain` are **already-resolved strings**
 * — the caller resolves glyph names with `useGlyph()` / `glyph(name, set)` and
 * passes the rendered char (or text fallback) here. List stays dumb: it draws
 * what it's handed and never touches the glyph registry or the icon set for row
 * content. (The nav caret is the one exception — it's chrome, not data.)
 */
export interface ListRowData {
  /** Stable identity, used for focus/selection lookups and React keys. */
  id: string;
  /** The row's primary text, in `fg`. */
  label: string;
  /** Optional resolved state glyph (e.g. `✓`), drawn before the label. */
  glyph?: string;
  /** Colour for `glyph`. Defaults to `tokens.fg`. */
  glyphColor?: string;
  /** Optional right-aligned secondary text, in `fgDim`. */
  meta?: string;
  /** Optional resolved domain glyph (e.g. `db`), drawn before the state glyph. */
  domain?: string;
  /** Colour for `domain`. Defaults to `tokens.fgMuted`. */
  domainColor?: string;
}

export interface ListRowProps {
  row: ListRowData;
  /** Carries the `▸` caret + `bgFocused` fill. Wins over `selected`. */
  focused?: boolean;
  /** Draws the `bgSelected` fill (only when not also focused). */
  selected?: boolean;
  /**
   * Fixed cell widths so the glyph columns line up down the whole list. `List`
   * computes these from the widest cell in each column; when a `ListRow` is used
   * standalone they default to its own content width.
   */
  caretWidth?: number;
  domainWidth?: number;
  glyphWidth?: number;
}

export interface ListProps {
  rows: ListRowData[];
  /** Id of the row that holds the nav caret. */
  focusedId?: string | null;
  /** Ids drawn with the selection fill. */
  selectedIds?: Set<string>;
  /**
   * Max rows to render, including any overflow-marker rows. Omit to render every
   * row (today's behaviour). When set and `rows` exceeds it, List shows a window
   * that always contains `focusedId` and scrolls as focus nears an edge —
   * keyboard-paged, never mouse-scrolled (see the contract).
   */
  height?: number;
  /** Context rows kept before the window scrolls. Default 0 (scroll at the edge). */
  scrolloff?: number;
  /** Draw `▴ N more` / `▾ N more` on overflowing sides. Default true. */
  overflowMarkers?: boolean;
}

/** The dim `▴ N more` / `▾ N more` chrome row drawn on a clipped side. */
function OverflowMarker({ glyph, count }: { glyph: string; count: number }): React.ReactElement {
  const tokens = useTokens();
  return (
    <Box flexDirection="row">
      <Text> </Text>
      <Text color={tokens.fgDim}>{`${glyph} ${count} more`}</Text>
    </Box>
  );
}

/**
 * A single list row — a caret column, optional domain + state glyphs, the
 * label, then the meta pushed to the right. The focused row fills with
 * `bgFocused`; a selected-but-unfocused row fills with `bgSelected`. No hover,
 * by contract.
 *
 * Each glyph column is a **fixed-width cell** (truncating, never wrapping), so
 * labels stay column-aligned no matter how wide a row's domain/state glyph (or
 * its multi-char `ascii`/`unicode` fallback) renders. The caret cell is sized to
 * the focus glyph's own width, so a focused row never shifts its neighbours.
 */
export function ListRow({
  row,
  focused = false,
  selected = false,
  caretWidth,
  domainWidth,
  glyphWidth,
}: ListRowProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();

  const backgroundColor = focused
    ? tokens.bgFocused
    : selected
      ? tokens.bgSelected
      : undefined;

  // Fall back to the row's own content width when used outside <List>.
  const caretW = caretWidth ?? Math.max(1, cellWidth(g('focus')));
  const domainW = domainWidth ?? (row.domain ? cellWidth(row.domain) : 0);
  const glyphW = glyphWidth ?? Math.max(1, cellWidth(row.glyph ?? ' '));

  // Ink only paints `backgroundColor` behind <Text> glyphs — a <Box> has no
  // fill — so a focused/selected row's highlight is built as bg-coloured runs
  // end to end: each fixed-width cell padded to fill, the column gaps and
  // left/right insets as bg spaces, and a grow-to-fill spacer carrying the same
  // bg. The whole row then reads as one continuous band instead of striping
  // only the text. (Unselected rows pass `undefined`, so spacing is identical.)
  // Pad to a fixed cell width with spaces that carry the row background. We pad
  // *inside* the <Text> rather than wrapping each cell in a fixed-width <Box>:
  // a <Box> can't hold a background, so any width it pads beyond the glyph would
  // be an uncoloured hole in the highlight band. Padding here keeps every cell
  // exactly `w` wide AND fully bg-filled, so adjacent cells form one band.
  const cell = (s: string, w: number): string => s + ' '.repeat(Math.max(0, w - cellWidth(s)));

  return (
    <Box flexDirection="row">
      <Text backgroundColor={backgroundColor}> </Text>
      <Text color={tokens.accent} backgroundColor={backgroundColor} wrap="truncate">
        {cell(focused ? g('focus') : ' ', caretW)}
      </Text>
      <Text backgroundColor={backgroundColor}> </Text>
      {domainW > 0 ? (
        <>
          <Text color={row.domainColor ?? tokens.fgMuted} backgroundColor={backgroundColor} wrap="truncate">
            {cell(row.domain ?? '', domainW)}
          </Text>
          <Text backgroundColor={backgroundColor}> </Text>
        </>
      ) : null}
      {/* The state-glyph cell is always present (a blank space when the row has
          no glyph), so labels stay column-aligned down the list. */}
      <Text color={row.glyphColor ?? tokens.fg} backgroundColor={backgroundColor} wrap="truncate">
        {cell(row.glyph ?? ' ', glyphW)}
      </Text>
      <Text backgroundColor={backgroundColor}> </Text>
      <Text color={tokens.fg} backgroundColor={backgroundColor} wrap="truncate">
        {row.label}
      </Text>
      {/* Grow-to-fill spacer carrying the row background (the contract's
          selection fill), so the band reaches the meta / right edge. flexBasis=0
          + minWidth=0 mean its 200-space content claims no base width and never
          squeezes the label/meta — it only fills slack. height=1 + overflow
          clips the spaces to one row WITHOUT a truncation `…` (the Pane
          border-filler trick); `wrap="truncate"` would inject an ellipsis. */}
      <Box flexGrow={1} flexBasis={0} minWidth={0} height={1} overflow="hidden">
        <Text backgroundColor={backgroundColor}>{' '.repeat(200)}</Text>
      </Box>
      {row.meta ? (
        <Text color={tokens.fgDim} backgroundColor={backgroundColor} wrap="truncate">
          {row.meta}
        </Text>
      ) : null}
      <Text backgroundColor={backgroundColor}> </Text>
    </Box>
  );
}

/**
 * A vertical stack of {@link ListRow}s — blink's plain list. Exactly one row may
 * be focused (`focusedId`); any number may be selected (`selectedIds`). Rows are
 * pure data ({@link ListRowData}); resolve glyph names before handing them over.
 *
 * List sizes the caret / domain / state-glyph columns to the widest cell across
 * all rows and passes those widths down, so every row shares one grid — the fix
 * for ragged columns when glyphs fall back to variable-width text.
 */
export function List({
  rows,
  focusedId,
  selectedIds,
  height,
  scrolloff = 0,
  overflowMarkers = true,
}: ListProps): React.ReactElement {
  const g = useGlyph();
  const sel = selectedIds ?? new Set<string>();

  // Window the rows when `height` is set. Omitting `height` passes `rows.length`,
  // which yields the full list with no markers — today's behaviour, unchanged.
  const focusedIndex = focusedId == null ? -1 : rows.findIndex((r) => r.id === focusedId);
  const { start, end, aboveCount, belowCount } = useListWindow({
    rowCount: rows.length,
    focusedIndex,
    height: height ?? rows.length,
    scrolloff,
    overflowMarkers,
  });
  const visible = rows.slice(start, end);

  // Column widths are measured across the FULL row set, not just the window, so
  // the grid stays put as a wide glyph scrolls in and out of view.
  const caretWidth = Math.max(1, cellWidth(g('focus')));
  const domainWidth = rows.reduce((m, r) => Math.max(m, r.domain ? cellWidth(r.domain) : 0), 0);
  const glyphWidth = rows.reduce((m, r) => Math.max(m, cellWidth(r.glyph ?? ' ')), 1);

  const showAbove = overflowMarkers && aboveCount > 0;
  const showBelow = overflowMarkers && belowCount > 0;

  return (
    <Box flexDirection="column">
      {showAbove ? <OverflowMarker glyph={g('moreAbove')} count={aboveCount} /> : null}
      {visible.map((row) => (
        <ListRow
          key={row.id}
          row={row}
          focused={row.id === focusedId}
          selected={sel.has(row.id)}
          caretWidth={caretWidth}
          domainWidth={domainWidth}
          glyphWidth={glyphWidth}
        />
      ))}
      {showBelow ? <OverflowMarker glyph={g('moreBelow')} count={belowCount} /> : null}
    </Box>
  );
}

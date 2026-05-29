import React from 'react';
import { Box, Spacer, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { cellWidth } from '../textWidth.js';

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
  /** Carries the `▶` caret + `bgFocused` fill. Wins over `selected`. */
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
}

/**
 * A single list row — a caret column, optional domain + state glyphs, the
 * label, then the meta pushed to the right. The focused row fills with
 * `bgFocused`; a selected-but-unfocused row fills with `bgSelected`. No hover,
 * by contract.
 *
 * Each glyph column is a **fixed-width cell** (truncating, never wrapping), so
 * labels stay column-aligned no matter how wide a row's domain/state glyph (or
 * its multi-char `ascii`/`unicode` fallback) renders. The caret cell is wide
 * enough to hold the two-cell `▶`, so a focused row never shifts its neighbours.
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
  const caretW = caretWidth ?? Math.max(2, cellWidth(g('focus')));
  const domainW = domainWidth ?? (row.domain ? cellWidth(row.domain) : 0);
  const glyphW = glyphWidth ?? Math.max(1, cellWidth(row.glyph ?? ' '));

  // Ink's <Box> has no `backgroundColor` (terminals have no box background);
  // the fill is painted onto the <Text> runs themselves — the contract's
  // "selection fill" applied via `backgroundColor` on text, used sparingly.
  return (
    <Box flexDirection="row" paddingX={1} gap={1}>
      <Box width={caretW} flexShrink={0}>
        <Text color={tokens.accent} backgroundColor={backgroundColor} wrap="truncate">
          {focused ? g('focus') : ' '}
        </Text>
      </Box>
      {domainW > 0 ? (
        <Box width={domainW} flexShrink={0}>
          <Text color={row.domainColor ?? tokens.fgMuted} backgroundColor={backgroundColor} wrap="truncate">
            {row.domain ?? ''}
          </Text>
        </Box>
      ) : null}
      {/* The state-glyph cell is always present (a blank space when the row has
          no glyph), so labels stay column-aligned down the list — the web kit's
          `{row.glyph || " "}`. Without it, glyph-less rows would slide one cell
          left of their neighbours. */}
      <Box width={glyphW} flexShrink={0}>
        <Text color={row.glyphColor ?? tokens.fg} backgroundColor={backgroundColor} wrap="truncate">
          {row.glyph ?? ' '}
        </Text>
      </Box>
      <Text color={tokens.fg} backgroundColor={backgroundColor} wrap="truncate">
        {row.label}
      </Text>
      {row.meta ? (
        <>
          <Spacer />
          <Text color={tokens.fgDim} backgroundColor={backgroundColor} wrap="truncate">
            {row.meta}
          </Text>
        </>
      ) : null}
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
export function List({ rows, focusedId, selectedIds }: ListProps): React.ReactElement {
  const g = useGlyph();
  const sel = selectedIds ?? new Set<string>();

  // The caret must hold the two-cell ▶ on the focused row (string-width reports
  // it as one, but most terminals draw it as two), so every row reserves ≥2.
  const caretWidth = Math.max(2, cellWidth(g('focus')));
  const domainWidth = rows.reduce((m, r) => Math.max(m, r.domain ? cellWidth(r.domain) : 0), 0);
  const glyphWidth = rows.reduce((m, r) => Math.max(m, cellWidth(r.glyph ?? ' ')), 1);

  return (
    <Box flexDirection="column">
      {rows.map((row) => (
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
    </Box>
  );
}

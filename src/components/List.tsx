import React from 'react';
import { Box, Spacer, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';

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
 * The inline cells sit one cell apart (the web kit's `gap: 1ch`). The caret
 * gets its own non-shrinking cell; it isn't pinned to a fixed width because the
 * `▶` glyph measures two cells wide in most terminals and would wrap if clipped
 * to one.
 */
export function ListRow({ row, focused = false, selected = false }: ListRowProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();

  const backgroundColor = focused
    ? tokens.bgFocused
    : selected
      ? tokens.bgSelected
      : undefined;

  // Ink's <Box> has no `backgroundColor` (terminals have no box background);
  // the fill is painted onto the <Text> runs themselves — the contract's
  // "selection fill" applied via `backgroundColor` on text, used sparingly.
  return (
    <Box flexDirection="row" paddingX={1} gap={1}>
      <Box flexShrink={0}>
        <Text color={tokens.accent} backgroundColor={backgroundColor}>
          {focused ? g('focus') : ' '}
        </Text>
      </Box>
      {row.domain ? (
        <Box flexShrink={0}>
          <Text color={row.domainColor ?? tokens.fgMuted} backgroundColor={backgroundColor}>
            {row.domain}
          </Text>
        </Box>
      ) : null}
      {/* The state-glyph cell is always present (a blank space when the row has
          no glyph), so labels stay column-aligned down the list — the web kit's
          `{row.glyph || " "}`. Without it, glyph-less rows would slide one cell
          left of their neighbours. */}
      <Box flexShrink={0}>
        <Text color={row.glyphColor ?? tokens.fg} backgroundColor={backgroundColor}>
          {row.glyph ?? ' '}
        </Text>
      </Box>
      <Text color={tokens.fg} backgroundColor={backgroundColor}>
        {row.label}
      </Text>
      {row.meta ? (
        <>
          <Spacer />
          <Text color={tokens.fgDim} backgroundColor={backgroundColor}>
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
 */
export function List({ rows, focusedId, selectedIds }: ListProps): React.ReactElement {
  const sel = selectedIds ?? new Set<string>();
  return (
    <Box flexDirection="column">
      {rows.map((row) => (
        <ListRow
          key={row.id}
          row={row}
          focused={row.id === focusedId}
          selected={sel.has(row.id)}
        />
      ))}
    </Box>
  );
}

import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { stateGlyph, selectionIntents, glyphColor } from '../glyphs/glyphs.js';
import { cellWidth } from '../textWidth.js';
import { useListWindow } from '../hooks/useListWindow.js';

/**
 * One row's worth of data — declared as **intent**, never style. A row says what
 * it MEANS (`state="installed"`, `selected`, `domain="postgresql"`) and the
 * framework resolves the glyph and its colour from the house tokens. The
 * consumer never passes a raw glyph or a raw colour. (The focus caret is the one
 * exception — it is chrome, not data.)
 */
export interface ListRowData {
  /** Stable identity, used for focus/selection lookups and React keys. */
  id: string;
  /** The row's primary text, in `fg` (or `fgDim` when `muted`). */
  label: string;
  /**
   * Semantic status name → the framework draws its glyph + colour:
   * `installed | ok | done | missing | error | drift | partial | idempotent |
   * pending | warn | info`. See `stateGlyph()`.
   */
  state?: string;
  /** Selection intent → `☑ / ☐`. Presence of the field (even `false`) opts the row into the checkbox column. */
  selected?: boolean;
  /** Required, non-toggle (implies selected) → `▣`. */
  locked?: boolean;
  /** A **registered** domain glyph name → the glyph + its colour, owned at registration. */
  domain?: string;
  /** Right-aligned consequence / aside text (content), in `fgDim`. */
  meta?: string;
  /** De-emphasise the whole row (e.g. a disabled / required label). */
  muted?: boolean;
}

export interface ListRowProps {
  row: ListRowData;
  /** Carries the `►` caret + `bgFocused` fill. Wins over `selected`. */
  focused?: boolean;
  /** Draws the `bgSelected` fill (only when not also focused). */
  selected?: boolean;
  /**
   * Which intent columns this row reserves, and their fixed cell widths, so the
   * glyph columns line up down the whole list. `List` computes these from the
   * widest cell in each column; a standalone `ListRow` derives them from itself.
   */
  showCheckbox?: boolean;
  showState?: boolean;
  showDomain?: boolean;
  caretWidth?: number;
  checkboxWidth?: number;
  stateWidth?: number;
  domainWidth?: number;
}

export interface ListProps {
  rows: ListRowData[];
  /** Id of the row that holds the nav caret. */
  focusedId?: string | null;
  /** Ids drawn with the selection fill. */
  selectedIds?: Set<string>;
  /**
   * Max rows to render, including any overflow-marker rows. Omit to render every
   * row. When set and `rows` exceeds it, List shows a window that always contains
   * `focusedId` and scrolls as focus nears an edge — keyboard-paged, never
   * mouse-scrolled (see the contract).
   */
  height?: number;
  /** Context rows kept before the window scrolls. Default 0 (scroll at the edge). */
  scrolloff?: number;
  /** Draw `▴ N more` / `▾ N more` on overflowing sides. Default true. */
  overflowMarkers?: boolean;
}

/** Does this row opt into the checkbox column? Presence of `selected` (even false) or `locked` does. */
function hasSelectionIntent(row: ListRowData): boolean {
  return row.locked === true || 'selected' in row;
}

/** Resolve a row's selection intent → glyph name + colour token, or null when it has none. */
function rowSelection(row: ListRowData) {
  if (row.locked) return selectionIntents.locked;
  if (!('selected' in row)) return null;
  return row.selected ? selectionIntents.selected : selectionIntents.unselected;
}

/** The dim `▴ N more` / `▾ N more` chrome row drawn on a clipped side. */
function OverflowMarker({ glyph, count }: { glyph: string; count: number }): React.ReactElement {
  const tokens = useTokens();
  return (
    <Box flexDirection="row">
      <Text> </Text>
      <Text color={tokens.fgFaint}>{`${glyph} ${count} more`}</Text>
    </Box>
  );
}

/**
 * A single list row — a caret column, then the optional intent columns
 * (checkbox · state · domain), the label, then the meta pushed right. The
 * focused row fills with `bgFocused`; a selected-but-unfocused row fills with
 * `bgSelected`. No hover, by contract.
 *
 * Each intent column is a **fixed-width cell** (truncating, never wrapping), so
 * labels stay column-aligned no matter how wide a row's glyph (or its multi-char
 * `ascii`/`unicode` fallback) renders. The glyph and its colour are resolved
 * here from the row's intent — the consumer hands over meaning, not pixels.
 */
export function ListRow({
  row,
  focused = false,
  selected = false,
  showCheckbox,
  showState,
  showDomain,
  caretWidth,
  checkboxWidth,
  stateWidth,
  domainWidth,
}: ListRowProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();

  const backgroundColor = focused ? tokens.bgFocused : selected ? tokens.bgSelected : undefined;

  // Resolve intent → glyph string + colour for each column.
  const sel = rowSelection(row);
  const checkStr = sel ? g(sel.glyph) : '';
  const checkColor = row.muted ? tokens.fgDim : sel ? tokens[sel.token] : tokens.fgDim;

  const st = row.state ? stateGlyph(row.state) : null;
  const stateStr = st ? g(st.glyph) : '';
  const stateColor = row.muted ? tokens.fgDim : st ? tokens[st.token] : tokens.fg;

  const domainStr = row.domain ? g(row.domain) : '';
  // Domain colour is intent, not style: the glyph entry owns a hue-family token
  // (e.g. `domainBlue`); we resolve it through the active theme so a postgres row
  // recolours with the surface instead of carrying a baked hex.
  const domainToken = row.domain ? glyphColor(row.domain) : undefined;
  const domainColor = row.muted
    ? tokens.fgDim
    : domainToken
      ? tokens[domainToken]
      : tokens.fgMuted;

  const labelColor = row.muted ? tokens.fgDim : tokens.fg;

  // Column presence / widths: use the list-wide values when given, else derive
  // from this row alone (standalone <ListRow> outside a <List>).
  const wantCheckbox = showCheckbox ?? hasSelectionIntent(row);
  const wantState = showState ?? row.state != null;
  const wantDomain = showDomain ?? row.domain != null;
  const caretW = caretWidth ?? Math.max(1, cellWidth(g('focus')));
  const checkW = checkboxWidth ?? Math.max(1, cellWidth(checkStr));
  const stateW = stateWidth ?? Math.max(1, cellWidth(stateStr));
  const domainW = domainWidth ?? Math.max(1, cellWidth(domainStr));

  // Pad to a fixed cell width with spaces that carry the row background. Padding
  // happens inside the <Text> (not via a fixed-width <Box>, which can't hold a
  // background) so every cell is exactly `w` wide AND fully bg-filled — adjacent
  // cells form one continuous highlight band rather than striping only the text.
  const cell = (s: string, w: number): string => s + ' '.repeat(Math.max(0, w - cellWidth(s)));

  return (
    <Box flexDirection="row">
      <Text backgroundColor={backgroundColor}> </Text>
      <Text color={tokens.accent} backgroundColor={backgroundColor} wrap="truncate">
        {cell(focused ? g('focus') : '', caretW)}
      </Text>
      <Text backgroundColor={backgroundColor}> </Text>
      {wantCheckbox ? (
        <>
          <Text color={checkColor} backgroundColor={backgroundColor} wrap="truncate">
            {cell(checkStr, checkW)}
          </Text>
          <Text backgroundColor={backgroundColor}> </Text>
        </>
      ) : null}
      {wantState ? (
        <>
          <Text color={stateColor} backgroundColor={backgroundColor} wrap="truncate">
            {cell(stateStr, stateW)}
          </Text>
          <Text backgroundColor={backgroundColor}> </Text>
        </>
      ) : null}
      {wantDomain ? (
        <>
          <Text color={domainColor} backgroundColor={backgroundColor} wrap="truncate">
            {cell(domainStr, domainW)}
          </Text>
          <Text backgroundColor={backgroundColor}> </Text>
        </>
      ) : null}
      <Text color={labelColor} backgroundColor={backgroundColor} wrap="truncate">
        {row.label}
      </Text>
      {/* Grow-to-fill spacer carrying the row background (the selection fill), so
          the band reaches the meta / right edge. flexBasis=0 + minWidth=0 mean
          its 200-space content claims no base width and never squeezes the
          label/meta — it only fills slack. height=1 + overflow clips the spaces
          to one row WITHOUT a truncation `…` (`wrap="truncate"` would inject one). */}
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
 * be focused (`focusedId`); any number may be selection-filled (`selectedIds`).
 * Rows are pure **intent** ({@link ListRowData}); the list resolves the glyphs.
 *
 * List sizes the caret / checkbox / state / domain columns to the widest cell
 * across all rows and passes those widths down, so every row shares one grid —
 * the fix for ragged columns when glyphs fall back to variable-width text.
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

  // Which intent columns any row needs.
  const showCheckbox = rows.some(hasSelectionIntent);
  const showState = rows.some((r) => r.state != null);
  const showDomain = rows.some((r) => r.domain != null);

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
  const checkboxWidth = showCheckbox
    ? rows.reduce((m, r) => {
        const s = rowSelection(r);
        return Math.max(m, s ? cellWidth(g(s.glyph)) : 1);
      }, 1)
    : 0;
  const stateWidth = showState
    ? rows.reduce((m, r) => {
        const st = r.state ? stateGlyph(r.state) : null;
        return Math.max(m, st ? cellWidth(g(st.glyph)) : 1);
      }, 1)
    : 0;
  const domainWidth = showDomain
    ? rows.reduce((m, r) => Math.max(m, r.domain ? cellWidth(g(r.domain)) : 1), 1)
    : 0;

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
          showCheckbox={showCheckbox}
          showState={showState}
          showDomain={showDomain}
          caretWidth={caretWidth}
          checkboxWidth={checkboxWidth}
          stateWidth={stateWidth}
          domainWidth={domainWidth}
        />
      ))}
      {showBelow ? <OverflowMarker glyph={g('moreBelow')} count={belowCount} /> : null}
    </Box>
  );
}

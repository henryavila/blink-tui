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
}

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

/**
 * The always-visible hotkey bar pinned to the bottom row. A single sunken-fill
 * line: hotkeys flush-left (3-cell gaps), an optional status node flush-right
 * in faint text. Never wraps — the bar is one cell tall by contract.
 *
 * When the chips + status don't fit the terminal width, whole chips are dropped
 * from the right rather than clipped mid-word (a chip reading `he` or a `q` with
 * no label is worse than one fewer key). Apps should order `keys` by importance.
 *
 * Ink's `<Box>` has no fill (only `<Text>` takes `backgroundColor`), and a
 * terminal cell can't layer — every cell is one glyph with one fg + one bg. So
 * the solid sunken bar of the design system is built by making the *gaps and
 * padding themselves* background-carrying spaces inside a single `<Text>`, with
 * the inverse key chips nested as `<Text>` that override the bg. That paints the
 * whole row edge-to-edge rather than only the cells under the glyphs.
 *
 * A measurable (string) `right` is flush-right with an exact space fill. An
 * unmeasurable React-node `right` falls back to the flex layout below (its
 * middle gap stays unfilled), since the fill width can't be computed.
 */
export function Footer({ keys = [], right, marginTop = 1 }: FooterProps): React.ReactElement {
  const tokens = useTokens();
  const { columns } = useStdoutDimensions();

  // Reserve the row: paddingX (2) + the right status (if measurable) + a 1-cell
  // breathing gap before it. Only string `right` can be measured; nodes reserve 0.
  const rightStr = typeof right === 'string' ? right : null;
  const rightWidth = rightStr != null ? cellWidth(rightStr) : 0;
  const budget = Math.max(0, columns - 2 - (rightWidth > 0 ? rightWidth + 1 : 0));

  // Greedily keep whole chips that fit (3-cell gap between them); drop the rest.
  const shown: HotkeyDef[] = [];
  let used = 0;
  for (const h of keys) {
    const w = (shown.length > 0 ? 3 : 0) + chipWidth(h);
    if (used + w > budget) break;
    used += w;
    shown.push(h);
  }

  // Node `right`: can't measure it, so keep the flex layout (middle gap unfilled).
  if (right != null && rightStr == null) {
    return (
      <Box flexDirection="row" paddingX={1} justifyContent="space-between" marginTop={marginTop} flexShrink={0}>
        <Box flexDirection="row" gap={3} flexShrink={1} overflow="hidden">
          {shown.map((h, i) => (
            <Hotkey key={i} k={h.k} desc={h.desc} />
          ))}
        </Box>
        <Box flexShrink={0}>
          <Text color={tokens.fgFaint} backgroundColor={tokens.bgSunken} wrap="truncate">
            {right}
          </Text>
        </Box>
      </Box>
    );
  }

  // String / no `right`: one continuous sunken bar. `1` left pad, `1` right pad.
  const fill = ' '.repeat(Math.max(0, columns - 1 - used - rightWidth - 1));

  return (
    <Box marginTop={marginTop} flexShrink={0}>
      <Text backgroundColor={tokens.bgSunken} wrap="truncate">
        {' '}
        {shown.map((h, i) => (
          <Text key={i}>
            {i > 0 ? '   ' : ''}
            <Text color={tokens.fgInverse} backgroundColor={tokens.bgInverse}>{' ' + h.k + ' '}</Text>
            <Text color={tokens.fgMuted}>{' ' + h.desc}</Text>
          </Text>
        ))}
        {fill}
        {rightStr != null ? <Text color={tokens.fgFaint}>{rightStr}</Text> : null}
        {' '}
      </Text>
    </Box>
  );
}

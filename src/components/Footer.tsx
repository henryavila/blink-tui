import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';

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

/**
 * The always-visible hotkey bar pinned to the bottom row. A single sunken-fill
 * line: hotkeys flush-left (3-cell gaps), an optional status node flush-right
 * in faint text. Never wraps — the bar is one cell tall by contract.
 *
 * Ink's `<Box>` has no fill, so the sunken background lives on the `<Text>`
 * leaves (behind the actual glyphs) rather than the row box — the same way
 * inverse hotkey chips are filled. The padding cells stay unfilled, matching
 * how a terminal status bar reads.
 */
export function Footer({ keys = [], right }: FooterProps): React.ReactElement {
  const tokens = useTokens();
  return (
    <Box flexDirection="row" paddingX={1} justifyContent="space-between">
      <Box flexDirection="row" gap={3} flexShrink={1} overflow="hidden">
        {keys.map((h, i) => (
          <Hotkey key={i} k={h.k} desc={h.desc} />
        ))}
      </Box>
      {right != null ? (
        <Box flexShrink={0}>
          <Text color={tokens.fgFaint} backgroundColor={tokens.bgSunken} wrap="truncate">
            {right}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}

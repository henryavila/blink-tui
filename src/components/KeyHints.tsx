import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { cellWidth } from '../textWidth.js';
import { useStdoutDimensions } from '../hooks/useStdoutDimensions.js';
import type { HotkeyDef } from './Footer.js';

export interface KeyHintsProps {
  /**
   * Local hint chips — same mental model as {@link Footer} (`k` + `desc`).
   * Pure display; does not bind keys. When both Footer and KeyHints show the
   * same key, the app should de-dupe; Footer remains global authority.
   */
  keys?: HotkeyDef[];
  /**
   * Max cells. Defaults to live terminal width. Whole chips drop from the
   * right when space is short (same greedy rule as Footer).
   */
  width?: number;
}

function chipWidth(h: HotkeyDef): number {
  return cellWidth(h.k) + 2 + cellWidth(h.desc) + 1;
}

/**
 * A **local** set of key hints near a panel (handoff, dialog-adjacent) without
 * replacing the global {@link Footer}. Shares the inverse-video chip language
 * with Footer but sits in the content flow (no sunken full-width bar, no
 * forced bottom pin).
 *
 * Zero hints → renders nothing (no empty padding noise).
 */
export function KeyHints({ keys = [], width }: KeyHintsProps): React.ReactElement | null {
  const tokens = useTokens();
  const { columns } = useStdoutDimensions();
  const budget = Math.max(0, width ?? columns);

  if (keys.length === 0) return null;

  const shown: HotkeyDef[] = [];
  let used = 0;
  for (const h of keys) {
    const w = (shown.length > 0 ? 2 : 0) + chipWidth(h);
    if (used + w > budget) break;
    used += w;
    shown.push(h);
  }

  if (shown.length === 0) return null;

  return (
    <Box flexDirection="row" gap={2} flexShrink={1} overflow="hidden">
      {shown.map((h, i) => (
        <Box key={i} flexShrink={0}>
          <Text color={tokens.fgInverse} backgroundColor={tokens.bgInverse} wrap="truncate">
            {' ' + h.k + ' '}
          </Text>
          <Text color={tokens.fgMuted} wrap="truncate">
            {' ' + h.desc}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

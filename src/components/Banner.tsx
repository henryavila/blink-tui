import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';

/** Notice severity — the only thing the consumer expresses. */
export type BannerTone = 'info' | 'success' | 'warn';

export interface BannerProps {
  /** Rich body. Wins over `text` when both are given. */
  children?: React.ReactNode;
  /** Plain-text body, the common case. */
  text?: string;
  /** Intent — the framework picks the leading glyph + its colour. Default `'info'`. */
  tone?: BannerTone;
}

/** tone → (leading glyph name, colour token). Owned by the framework. */
const TONES = {
  info: { glyph: 'depends', token: 'stateInfo' },
  success: { glyph: 'check', token: 'stateOk' },
  warn: { glyph: 'warn', token: 'stateWarn' },
} as const;

/**
 * A one-line, non-blocking notice in the content flow — "auto-selected X",
 * "saved", "3 items skipped". The middle ground between the blocking
 * {@link Dialog} and the persistent `Footer`: it acknowledges a side effect
 * without stealing focus.
 *
 * INTENT, NOT STYLE: the consumer picks a `tone`; the framework owns the leading
 * glyph and the colour. Per the contract, semantic colour lives on the glyph —
 * the message text stays calm (`fgMuted`). Purely presentational: no timer, no
 * auto-dismiss (the app mounts/unmounts it, keeping the one-animation contract
 * clean).
 */
export function Banner({ children, text, tone = 'info' }: BannerProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();
  const t = TONES[tone] ?? TONES.info;
  const body = children ?? text ?? '';

  return (
    <Box flexDirection="row">
      <Text color={tokens[t.token]}>{g(t.glyph) + ' '}</Text>
      <Text color={tokens.fgMuted}>{body}</Text>
    </Box>
  );
}

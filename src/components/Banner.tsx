import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';

export interface BannerProps {
  /** Rich body. Wins over `text` when both are given. */
  children?: React.ReactNode;
  /** Plain-text body, the common case. */
  text?: string;
  /** Intent — picks the semantic token. Default `'info'`. */
  tone?: 'info' | 'warn' | 'success';
  /** Optional resolved leading glyph (resolve names with `useGlyph` first). */
  glyph?: string;
}

/**
 * A one-line, non-blocking notice in the content flow — "auto-selected X",
 * "saved", "3 items skipped". The middle ground between the blocking
 * {@link Dialog} and the persistent `Footer`: it acknowledges a side effect
 * without stealing focus.
 *
 * Purely presentational — no timer, no auto-dismiss (the app mounts/unmounts it,
 * keeping the one-animation contract clean). The tone colours the leading glyph
 * (semantic colour on glyphs, per the contract); with no glyph the tone falls
 * back to tinting the line so the intent still reads.
 */
export function Banner({ children, text, tone = 'info', glyph }: BannerProps): React.ReactElement {
  const tokens = useTokens();
  const color =
    tone === 'warn' ? tokens.stateWarn : tone === 'success' ? tokens.stateOk : tokens.stateInfo;
  const body = children ?? text ?? '';

  return (
    <Box flexDirection="row">
      {glyph ? <Text color={color}>{`${glyph} `}</Text> : null}
      <Text color={glyph ? tokens.fg : color}>{body}</Text>
    </Box>
  );
}

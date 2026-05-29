import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { blocks } from '../glyphs/glyphs.js';

export interface HeaderProps {
  /**
   * Leading accent mark. Defaults to the blink cursor block `▎`. Pass a node
   * (e.g. a blinking `<Cursor />`) for the live mark, or a string for a static
   * one; `null` drops the mark entirely.
   */
  mark?: React.ReactNode;
  /** Screen title, in `fg`. */
  title: string;
  /** Optional aside, rendered `· subtitle` in `fgMuted`. */
  subtitle?: string;
  /** Optional node flush-right — status, counts, a delta summary. */
  right?: React.ReactNode;
}

/**
 * The one-row status bar that tops a blink screen: a lavender mark, a title
 * (with an optional `· subtitle`), and a right-aligned status slot. It recurs on
 * every wizard / app screen — the brand chrome — so it is a primitive, not
 * per-app code. One line, never wraps; the subtitle truncates first.
 */
export function Header({
  mark = blocks.cursor,
  title,
  subtitle,
  right,
}: HeaderProps): React.ReactElement {
  const tokens = useTokens();
  return (
    <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
      <Box flexDirection="row" flexShrink={1} overflow="hidden">
        {mark != null && mark !== '' ? (
          <Text color={tokens.accent}>{mark}</Text>
        ) : null}
        <Text color={tokens.fg} wrap="truncate">{(mark != null && mark !== '' ? ' ' : '') + title}</Text>
        {subtitle ? (
          <Text color={tokens.fgMuted} wrap="truncate">{' · ' + subtitle}</Text>
        ) : null}
      </Box>
      {right != null ? (
        <Box flexShrink={0}>
          {typeof right === 'string' ? <Text color={tokens.fgMuted}>{right}</Text> : right}
        </Box>
      ) : null}
    </Box>
  );
}

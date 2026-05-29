import React from 'react';
import { Box, Text } from 'ink';
import type { BoxProps } from 'ink';
import { useIconSet, useTokens } from '../theme/context.js';
import { boxChars, type BoxStyleName } from '../glyphs/glyphs.js';

/** Pane border treatments, in the language of the design system. */
export type PaneVariant = 'default' | 'rounded' | 'double' | 'error';

export interface PaneProps {
  /** Title shown inside the top border: `┌─ title ──────┐`. Keep ≤ 18 chars. */
  title?: string;
  /**
   * Focused panes get a lavender border. With no explicit `variant`, focus also
   * promotes the border to double-line (the contract's "elevation = weight").
   */
  focused?: boolean;
  /** Override the border treatment. */
  variant?: PaneVariant;
  /** Flex grow factor (default 1 — panes fill available space). */
  flexGrow?: number;
  /** Flex basis (e.g. `'56%'`). */
  flexBasis?: BoxProps['flexBasis'];
  /** Fixed width in cells. */
  width?: BoxProps['width'];
  /** Fixed height in cells. */
  height?: BoxProps['height'];
  /** Minimum height in cells. */
  minHeight?: BoxProps['minHeight'];
  children?: React.ReactNode;
}

function inkBorderStyle(style: BoxStyleName, ascii: boolean): NonNullable<BoxProps['borderStyle']> {
  if (ascii) return 'classic';
  if (style === 'rounded') return 'round';
  return style; // 'single' | 'double'
}

/**
 * A box-drawn rectangle with an optional title in the top border — the
 * analogue of a "card" in blink (panes don't lift, round, or shadow).
 *
 * Borders are real box-drawing glyphs. Ink's native border renders the
 * full-height left/right sides and the bottom edge; the top edge is drawn by
 * hand so the title can sit *inside* it. The two halves share a width, so they
 * join into one continuous frame.
 */
export function Pane({
  title,
  focused = false,
  variant,
  flexGrow = 1,
  flexBasis,
  width,
  height,
  minHeight,
  children,
}: PaneProps): React.ReactElement {
  const tokens = useTokens();
  const iconSet = useIconSet();
  const ascii = iconSet === 'ascii';

  const isError = variant === 'error';
  const style: BoxStyleName =
    variant === 'rounded'
      ? 'rounded'
      : variant === 'double' || isError
        ? 'double'
        : focused
          ? 'double'
          : 'single';

  const chars = boxChars(style, iconSet);

  const borderColor = isError
    ? tokens.stateErr
    : focused
      ? tokens.borderFocus
      : tokens.border;
  const titleColor = isError
    ? tokens.stateErr
    : focused
      ? tokens.accent
      : tokens.fgMuted;

  return (
    <Box
      flexDirection="column"
      flexGrow={flexGrow}
      flexBasis={flexBasis}
      width={width}
      height={height}
      minHeight={minHeight}
      minWidth={0}
    >
      {/* Top border, drawn by hand so the title nests inside it. The fixed
          parts never shrink; the dash filler grows and is clipped to one row
          (no ellipsis) by an overflow-hidden, height-1 box. */}
      <Box flexDirection="row" height={1}>
        <Box flexShrink={0}>
          <Text color={borderColor}>{chars.tl + chars.h}</Text>
        </Box>
        {title ? (
          <Box flexShrink={0}>
            <Text color={titleColor} wrap="truncate">{' ' + title + ' '}</Text>
          </Box>
        ) : null}
        <Box flexGrow={1} height={1} overflow="hidden">
          <Text color={borderColor}>{chars.h.repeat(200)}</Text>
        </Box>
        <Box flexShrink={0}>
          <Text color={borderColor}>{chars.tr}</Text>
        </Box>
      </Box>

      {/* Body — Ink draws the left/right/bottom border at full height. */}
      <Box
        flexGrow={1}
        minHeight={0}
        flexDirection="column"
        borderStyle={inkBorderStyle(style, ascii)}
        borderColor={borderColor}
        borderTop={false}
        paddingX={1}
      >
        {children}
      </Box>
    </Box>
  );
}

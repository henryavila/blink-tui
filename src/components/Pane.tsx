import React from 'react';
import { Box, Text } from 'ink';
import type { BoxProps } from 'ink';
import { useIconSet, useTokens } from '../theme/context.js';
import { boxChars, type BoxStyleName } from '../glyphs/glyphs.js';

/**
 * Pane emphasis, by PURPOSE — the consumer declares what a pane *means*, blink
 * draws it. There is exactly one border shape in the house style (single-line,
 * rounded), so tone never changes the geometry, only the colour:
 *
 * - `resting` — a pane at rest (muted border).
 * - `focus`   — the focused pane (border + title recoloured lavender).
 * - `error`   — an error / destructive pane (border + title red).
 */
export type PaneTone = 'resting' | 'focus' | 'error';

/**
 * Legacy border treatments. Kept only so older call sites keep working while
 * they migrate to {@link PaneTone}. `'double'` is gone from the house style and
 * now renders as the rounded default; `'square'` is the one legacy shape opt-out.
 * @deprecated pass `tone` instead.
 */
export type PaneVariant = 'default' | 'rounded' | 'square' | 'double' | 'error';

export interface PaneProps {
  /** Title shown inside the top border: `╭─ title ──────╮`. Keep ≤ 18 chars. */
  title?: string;
  /**
   * Semantic emphasis. The framework owns the border colour, the title colour,
   * and the (always rounded) shape. Default `'resting'`.
   */
  tone?: PaneTone;
  /**
   * @deprecated use `tone="focus"`. A focused pane gets the lavender border.
   * Kept as a back-compat alias; `tone` wins when both are set.
   */
  focused?: boolean;
  /**
   * @deprecated use `tone`. `'error'` ⇒ `tone="error"`, `'square'` ⇒ the legacy
   * square shape; every other value falls through to the rounded house style.
   */
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
  return style === 'rounded' ? 'round' : 'single';
}

/**
 * A box-drawn rectangle with an optional title in the top border — the
 * analogue of a "card" in blink (panes don't lift, shadow, or change shape).
 *
 * Borders are real box-drawing glyphs. Ink's native border renders the
 * full-height left/right sides and the bottom edge; the top edge is drawn by
 * hand so the title can sit *inside* it. The two halves share a width, so they
 * join into one continuous frame. Focus and elevation are signalled by **border
 * colour** alone — the shape is identical across tones, so the layout never
 * shifts when a pane gains or loses focus.
 */
export function Pane({
  title,
  tone,
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

  // Resolve PURPOSE: prefer the semantic `tone`, then fall back to legacy props.
  const t: PaneTone =
    tone ?? (variant === 'error' ? 'error' : focused ? 'focus' : 'resting');

  // Resolve SHAPE: always rounded, except the legacy `variant="square"` escape.
  const style: BoxStyleName = variant === 'square' ? 'single' : 'rounded';
  const chars = boxChars(style, iconSet);

  const borderColor =
    t === 'error' ? tokens.stateErr : t === 'focus' ? tokens.borderFocus : tokens.border;
  const titleColor =
    t === 'error' ? tokens.stateErr : t === 'focus' ? tokens.accent : tokens.fgMuted;

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

import React from 'react';
import { Text } from 'ink';
import { useIconSet, useTokens } from '../theme/context.js';
import { blocks, blocksH } from '../glyphs/glyphs.js';

export interface ProgressBarProps {
  /** Progress in `0..1` (clamped). */
  value: number;
  /** Bar length in cells. */
  width: number;
  /** Filled colour. Defaults to `tokens.accent`. */
  color?: string;
  /** Track (empty rail) colour. Defaults to `tokens.border` (surface1), matching the design system's `bar-rest`. */
  trackColor?: string;
  /** Append a `  NN%` readout in `fgDim` after the bar. Defaults to `true`, matching the design system. */
  showPercent?: boolean;
}

/**
 * A determinate progress bar built from the horizontal eighth-block ramp
 * ({@link blocksH}) — the complement to the indeterminate {@link Spinner}. The
 * fractional cell renders to one of eight partials for sub-cell precision.
 *
 * The empty remainder is a visible `░` rail in the track colour (the design
 * system's `[████░░░░]` treatment), not blank space — so the bar always reads
 * as a bar, full or not.
 *
 * The `ascii` icon set has no partials, so it degrades to whole `#` cells (the
 * fractional eighth is dropped) over a blank track, like every other glyph that
 * falls back.
 */
export function ProgressBar({ value, width, color, trackColor, showPercent = true }: ProgressBarProps): React.ReactElement {
  const tokens = useTokens();
  const iconSet = useIconSet();
  const v = Math.max(0, Math.min(1, value));
  const fillColor = color ?? tokens.accent;
  const track = trackColor ?? tokens.border;
  const pct = showPercent ? <Text color={tokens.fgDim}>{`  ${Math.round(v * 100)}%`}</Text> : null;

  if (iconSet === 'ascii') {
    const full = Math.round(v * width);
    return (
      <Text>
        <Text color={fillColor}>{'#'.repeat(full)}</Text>
        <Text color={track}>{' '.repeat(Math.max(0, width - full))}</Text>
        {pct}
      </Text>
    );
  }

  const totalEighths = Math.round(v * width * 8);
  const fullCells = Math.floor(totalEighths / 8);
  const rem = totalEighths % 8;
  const filled = blocksH[8].repeat(fullCells) + (rem > 0 ? (blocksH[rem] ?? '') : '');
  const usedCells = fullCells + (rem > 0 ? 1 : 0);
  const empty = blocks.light.repeat(Math.max(0, width - usedCells));

  return (
    <Text>
      <Text color={fillColor}>{filled}</Text>
      <Text color={track}>{empty}</Text>
      {pct}
    </Text>
  );
}

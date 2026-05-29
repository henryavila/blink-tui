import React from 'react';
import { Text } from 'ink';
import { useIconSet, useTokens } from '../theme/context.js';
import { spinnerFor } from '../glyphs/glyphs.js';
import { useSpinnerFrame } from '../hooks/useSpinnerFrame.js';

export interface SpinnerProps {
  /** Advance the spinner. When false, the first frame is shown statically. Defaults to true. */
  active?: boolean;
  /** Override the glyph colour. Defaults to the info state token. */
  color?: string;
  /** Frame interval in ms. Defaults to 80 (the contract's spinner cadence). */
  intervalMs?: number;
}

/**
 * A one-cell animated spinner — braille for nerd/unicode, classic `| / - \` for
 * ascii. Frames advance every `intervalMs` while `active`; when inactive it
 * rests on frame 0 with no timer running.
 *
 * The frame counter comes from {@link useSpinnerFrame} and the glyph table from
 * {@link spinnerFor}, so the component stays icon-set agnostic — context decides
 * which alphabet renders.
 */
export function Spinner({ active = true, color, intervalMs = 80 }: SpinnerProps): React.ReactElement {
  const tokens = useTokens();
  const iconSet = useIconSet();
  const frames = spinnerFor(iconSet);
  const frame = useSpinnerFrame({ active, intervalMs });

  return <Text color={color ?? tokens.stateInfo}>{frames[frame % frames.length]}</Text>;
}

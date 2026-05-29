import { useEffect, useState } from 'react';

export interface SpinnerOptions {
  /** Advance only while true. Defaults to true. */
  active?: boolean;
  /** Frame interval in ms. Defaults to 80 (the contract's spinner cadence). */
  intervalMs?: number;
}

/**
 * A monotonically-increasing frame counter for spinners, advancing every
 * `intervalMs` (default 80 ms) while `active`. The caller picks the glyph:
 *
 * ```tsx
 * const frame = useSpinnerFrame({ active: syncing });
 * const frames = spinnerFor(iconSet);
 * <Text color={tokens.stateInfo}>{frames[frame % frames.length]}</Text>
 * ```
 *
 * Returns a counter rather than a glyph so it's icon-set agnostic and trivially
 * testable. Resets to 0 whenever it goes inactive.
 */
export function useSpinnerFrame(opts: SpinnerOptions = {}): number {
  const { active = true, intervalMs = 80 } = opts;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active) {
      setFrame(0);
      return;
    }
    const timer = setInterval(() => setFrame((f) => f + 1), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);

  return frame;
}

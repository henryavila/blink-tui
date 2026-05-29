import { useEffect, useState } from 'react';

/**
 * The cursor blink — blink's one sanctioned text animation.
 *
 * Returns a boolean that toggles at `hz` (default 1 Hz) with `step-end` timing:
 * fully on for half the period, fully off for the other half. No fade, by
 * contract. Pass `active=false` to hold it visible (e.g. an unfocused input).
 *
 * ```tsx
 * const on = useBlink();
 * <Text>{value}{on ? '▎' : ' '}</Text>
 * ```
 */
export function useBlink(active = true, hz = 1): boolean {
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (!active) {
      setOn(true);
      return;
    }
    const halfPeriod = Math.max(1, Math.round(1000 / hz / 2));
    const timer = setInterval(() => setOn((v) => !v), halfPeriod);
    return () => clearInterval(timer);
  }, [active, hz]);

  return active ? on : true;
}

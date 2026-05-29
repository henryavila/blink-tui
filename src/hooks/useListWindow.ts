import { useRef } from 'react';

export interface UseListWindowOptions {
  /** Total number of rows. */
  rowCount: number;
  /** Index of the focused row; `null` / `< 0` = no focus-follow (window holds). */
  focusedIndex: number | null;
  /** Max rows the viewport renders, INCLUDING any marker rows. */
  height: number;
  /**
   * Context rows kept between the caret and the edge before the window scrolls.
   * Default `0` → the caret may reach the last content row, and moving past it
   * scrolls the window by one (vim `scrolloff=0`).
   */
  scrolloff?: number;
  /**
   * Reserve a chrome row for the `▴`/`▾` "N more" marker on an overflowing side.
   * Default `true`. When `false`, the window still scrolls but clips silently.
   */
  overflowMarkers?: boolean;
}

export interface ListWindow {
  /** First visible CONTENT row index (inclusive). Slice with `rows.slice(start, end)`. */
  start: number;
  /** One past the last visible content row. */
  end: number;
  /** Rows hidden above / below the window (0 = none). Drive the markers off these. */
  aboveCount: number;
  belowCount: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Pure windowing math: given the previous window start, where does the window
 * sit now so it (a) fits `height`, (b) contains `focusedIndex`, and (c) reserves
 * a chrome row for each overflow marker that shows? Exported for unit tests and
 * for callers windowing something other than {@link useListWindow}.
 *
 * Markers are **separate chrome rows**, not overlays: `content + markers` always
 * equals `height`, so the window never exceeds its container, and `aboveCount` /
 * `belowCount` are the exact hidden-row counts (no off-by-one against a marker).
 * The caret is always inside the content band, so the focused row is never
 * hidden behind a "N more".
 *
 * Marker reservation and the window position are mutually dependent (a marker
 * costs a content row, which can move the window, which can flip a marker), so
 * the start is settled over a few passes, then the markers are finalised from
 * the settled start so the returned values are always self-consistent.
 *
 * One consequence: the *single* step where a marker first appears shifts the
 * window by two rows (the new marker claims a content row, so the band shrinks
 * by one as focus moves by one). Every other step is a smooth 1/row scroll —
 * the steady-state behaviour. The alternative (markers overlaying edge rows)
 * keeps 1/row but muddies the hidden-row counts; clean counts win here.
 */
export function computeWindow(
  prevStart: number,
  rowCount: number,
  focusedIndex: number | null,
  height: number,
  scrolloff = 0,
  overflowMarkers = true,
): ListWindow {
  const n = rowCount;
  const H = height;
  if (H <= 0) return { start: 0, end: 0, aboveCount: 0, belowCount: 0 };
  if (n <= H) return { start: 0, end: n, aboveCount: 0, belowCount: 0 };

  const i = focusedIndex == null || focusedIndex < 0 ? -1 : Math.min(focusedIndex, n - 1);
  let start = clamp(prevStart, 0, n - 1);

  // Settle `start`. Capacity flips at most once (H-1 ⇄ H-2) as the window nears
  // an edge, so a handful of passes always reaches the fixed point.
  for (let pass = 0; pass < 4; pass++) {
    const showAbove = overflowMarkers && start > 0;
    const cAbove = H - (showAbove ? 1 : 0);
    const showBelow = overflowMarkers && start + cAbove < n;
    const content = Math.max(1, cAbove - (showBelow ? 1 : 0));
    if (i >= 0) {
      const m = Math.min(scrolloff, Math.floor((content - 1) / 2));
      if (i < start + m) start = i - m;
      else if (i >= start + content - m) start = i - content + 1 + m;
    }
    start = clamp(start, 0, n - content);
  }

  // Finalise markers + content from the settled start so everything agrees.
  const showAbove = overflowMarkers && start > 0;
  const cAbove = H - (showAbove ? 1 : 0);
  const showBelow = overflowMarkers && start + cAbove < n;
  const content = Math.max(1, cAbove - (showBelow ? 1 : 0));
  start = clamp(start, 0, n - content);
  const end = start + content;
  return { start, end, aboveCount: start, belowCount: n - end };
}

/**
 * Headless windowing for a fixed-height viewport over a flat row array — the
 * engine behind a windowed {@link List}, and reusable on its own for any
 * keyboard-paged list.
 *
 * It owns the window **offset** across renders (view-state, like a scroll
 * position — *not* the focus/selection state the contract reserves for the app)
 * and re-derives the window each render to keep `focusedIndex` visible. The hook
 * never sees a keystroke: the app moves `focusedIndex`, the window follows. With
 * `scrolloff = 0` the caret travels to the edge of the viewport and only then
 * does the window scroll.
 *
 * ```tsx
 * const win = useListWindow({ rowCount: rows.length, focusedIndex, height: 20 });
 * const visible = rows.slice(win.start, win.end);
 * ```
 */
export function useListWindow(opts: UseListWindowOptions): ListWindow {
  const { rowCount, focusedIndex, height, scrolloff = 0, overflowMarkers = true } = opts;
  const startRef = useRef(0);
  const win = computeWindow(startRef.current, rowCount, focusedIndex, height, scrolloff, overflowMarkers);
  // Derived view-state: remember where the window landed so the next render can
  // keep it still while the caret travels inside it. computeWindow is idempotent
  // given a valid start, so re-running under StrictMode double-invocation is safe.
  startRef.current = win.start;
  return win;
}

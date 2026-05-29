import React from 'react';
import { render } from 'ink-testing-library';
import { describe, test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { List, type ListRowData } from '../src/components/List.js';
import { computeWindow, cellWidth } from '../src/index.js';

/** Rendered-row invariants that must hold for every window. */
function checkInvariants(
  w: { start: number; end: number; aboveCount: number; belowCount: number },
  n: number,
  H: number,
  i: number,
  markers = true,
) {
  const content = w.end - w.start;
  const markerRows = markers ? (w.aboveCount > 0 ? 1 : 0) + (w.belowCount > 0 ? 1 : 0) : 0;
  // content + markers exactly fills the height (window never exceeds container)
  if (n > H) expect(content + markerRows).toBe(H);
  else expect(content).toBe(n);
  // focus is always inside the content band — never hidden behind a marker
  if (i >= 0 && i < n) {
    expect(i).toBeGreaterThanOrEqual(w.start);
    expect(i).toBeLessThan(w.end);
  }
  // counts are exact, no off-by-one against a marker row
  expect(w.aboveCount).toBe(w.start);
  expect(w.belowCount).toBe(n - w.end);
}

describe('computeWindow', () => {
  test('renders everything with no markers when it fits', () => {
    const w = computeWindow(0, 5, 0, 10);
    expect(w).toEqual({ start: 0, end: 5, aboveCount: 0, belowCount: 0 });
  });

  test('at the top: bottom marker only', () => {
    const w = computeWindow(0, 20, 0, 5); // H=5, focus first
    expect(w.start).toBe(0);
    expect(w.aboveCount).toBe(0);
    expect(w.belowCount).toBeGreaterThan(0); // ▾ shows
    checkInvariants(w, 20, 5, 0);
  });

  test('at the bottom: top marker only, focus visible', () => {
    const w = computeWindow(0, 20, 19, 5);
    expect(w.belowCount).toBe(0); // no ▾
    expect(w.aboveCount).toBeGreaterThan(0); // ▴ shows
    checkInvariants(w, 20, 5, 19);
  });

  test('holds the window when focusedIndex is null', () => {
    const held = computeWindow(7, 20, null, 5);
    expect(held.start).toBe(7);
  });

  test('invariants hold across a full top→bottom sweep; steady-state scroll is 1/step', () => {
    const n = 30;
    const H = 8;
    let prev = 0;
    let lastStart = 0;
    const jumps: number[] = [];
    for (let i = 0; i < n; i++) {
      const w = computeWindow(prev, n, i, H, 0, true);
      checkInvariants(w, n, H, i);
      jumps.push(Math.abs(w.start - lastStart));
      lastStart = w.start;
      prev = w.start;
    }
    // Every step shifts the window by at most one content row, EXCEPT the single
    // moment a marker first appears (it claims a content row, so the window
    // shifts two that one time). At most one such 2-step in a one-way sweep;
    // everything else is the smooth 1/step the user expects.
    expect(Math.max(...jumps)).toBeLessThanOrEqual(2);
    expect(jumps.filter((j) => j === 2).length).toBeLessThanOrEqual(1);
  });

  test('a far jump still lands the focus in view (no single-step assumption)', () => {
    // window parked at the bottom, then focus leaps to the top
    const bottom = computeWindow(0, 40, 39, 6);
    const jumped = computeWindow(bottom.start, 40, 0, 6);
    checkInvariants(jumped, 40, 6, 0);
    expect(jumped.start).toBe(0);
  });

  test('scrolloff keeps a context row before the window scrolls', () => {
    // with scrolloff 1, reaching the second-to-last content row already scrolls
    const a = computeWindow(0, 20, 0, 8, 1, true);
    checkInvariants(a, 20, 8, 0, true);
    // focus deep in the middle keeps >=1 row of margin on both sides
    const mid = computeWindow(5, 20, 10, 8, 1, true);
    expect(10 - mid.start).toBeGreaterThanOrEqual(1);
    expect(mid.end - 1 - 10).toBeGreaterThanOrEqual(1);
  });

  test('overflowMarkers=false windows without reserving marker rows', () => {
    const w = computeWindow(0, 20, 10, 5, 0, false);
    expect(w.end - w.start).toBe(5); // full height of content, no chrome
    checkInvariants(w, 20, 5, 10, false);
  });
});

const rows: ListRowData[] = Array.from({ length: 20 }, (_, i) => ({
  id: `row-${i}`,
  label: `row-${i}`,
}));

describe('List windowing', () => {
  test('renders exactly `height` lines (content + markers) and keeps the focus visible', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <List rows={rows} focusedId="row-0" height={6} />
      </ThemeProvider>,
    );
    const frame = lastFrame() ?? '';
    const lines = frame.split('\n').filter((l) => /row-|more/.test(l));
    expect(lines).toHaveLength(6); // 5 content rows + 1 ▾ marker

    expect(frame).toContain('row-0');
    expect(frame).toContain('row-4');
    expect(frame).not.toContain('row-5');
    expect(frame).not.toContain('row-19');
    expect(frame).toContain('15 more'); // 20 - 5 content rows clipped below
    expect(frame).toContain('▾');
  });

  test('scrolls to keep a bottom-focused row in view with a ▴ marker', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <List rows={rows} focusedId="row-19" height={6} />
      </ThemeProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('row-19');
    expect(frame).toContain('row-15');
    expect(frame).not.toContain('row-14');
    expect(frame).toContain('▴');
    expect(frame).toContain('15 more');
  });

  test('renders every row when `height` is omitted (regression)', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <List rows={rows} focusedId="row-0" />
      </ThemeProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('row-19');
    expect(frame).not.toContain('more');
  });
});

test('cellWidth is exported and measures terminal cells', () => {
  expect(cellWidth('abc')).toBe(3);
  expect(cellWidth('⚠')).toBe(2); // wide glyph
  expect(cellWidth('[x]')).toBe(3); // ascii fallback
});

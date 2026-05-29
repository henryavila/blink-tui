import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Box, Text, measureElement } from 'ink';
import type { DOMElement } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { cellWidth } from '../textWidth.js';

export interface LogViewProps {
  /** The full line buffer. LogView renders only the tail that fits `height`. */
  lines: string[];
  /** Viewport height in rows, including an overflow-marker row when one shows. */
  height: number;
  /** Follow the newest line (default). `false` freezes the window as lines append. */
  follow?: boolean;
  /** Wrap long lines to the viewport width (default) vs truncate them. */
  wrap?: boolean;
  /** Viewport width in cells. Omit to measure the rendered box (Ink `measureElement`). */
  width?: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Greedy wrap a logical line into visual rows of at most `w` cells. */
function wrapLine(line: string, w: number): string[] {
  if (line.length === 0) return [''];
  const out: string[] = [];
  let cur = '';
  let curW = 0;
  for (const ch of Array.from(line)) {
    const cw = cellWidth(ch);
    if (curW + cw > w && cur.length > 0) {
      out.push(cur);
      cur = '';
      curW = 0;
    }
    cur += ch;
    curW += cw;
  }
  out.push(cur);
  return out;
}

/** Truncate a logical line to at most `w` cells. */
function truncateLine(line: string, w: number): string {
  let cur = '';
  let curW = 0;
  for (const ch of Array.from(line)) {
    const cw = cellWidth(ch);
    if (curW + cw > w) break;
    cur += ch;
    curW += cw;
  }
  return cur;
}

/**
 * A bottom-anchored, height-bounded viewport over an ever-growing line stream —
 * subprocess output, a build log, a chat transcript. The newest lines stay
 * pinned to the bottom; older lines fall off the top with a dim `▴ N more`
 * marker. The mirror of a windowed {@link List}: that one follows a *focused*
 * row, this one follows the *tail*.
 *
 * Unlike Ink's `<Static>` (append-only scrollback that grows past the screen),
 * LogView is a fixed region. The app owns the subprocess and feeds `lines`;
 * LogView only renders the tail — the window advancing on new data is content
 * re-render, not motion, under the one-animation contract.
 *
 * When `wrap` is on, a logical line spans `ceil(width / cellWidth)` visual rows,
 * so the tail is counted in **visual rows**, not array entries — which needs a
 * width. Pass `width` (it's known inside a sized `Pane`); otherwise LogView
 * measures its own box, approximating for the first frame.
 */
export function LogView({
  lines,
  height,
  follow = true,
  wrap = true,
  width,
}: LogViewProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();
  const ref = useRef<DOMElement>(null);
  const [measured, setMeasured] = useState(0);

  useEffect(() => {
    if (width != null || !ref.current) return;
    const m = measureElement(ref.current);
    if (m.width && m.width !== measured) setMeasured(m.width);
  });

  const w = Math.max(1, width ?? measured ?? 0) || 80;

  // Expand the buffer into visual rows once, so tail math is in real rows.
  const visual: string[] = [];
  for (const line of lines) {
    if (wrap) for (const vr of wrapLine(line, w)) visual.push(vr);
    else visual.push(truncateLine(line, w));
  }
  const total = visual.length;

  // bottomOffset = visual rows hidden below the window. Following pins it to 0;
  // frozen, it grows by however many rows appended so the window stays put.
  const bottomOffsetRef = useRef(0);
  const prevTotalRef = useRef(total);
  if (follow) {
    bottomOffsetRef.current = 0;
  } else {
    const delta = total - prevTotalRef.current;
    bottomOffsetRef.current = clamp(bottomOffsetRef.current + Math.max(0, delta), 0, Math.max(0, total - 1));
  }
  prevTotalRef.current = total;
  const bottomOffset = bottomOffsetRef.current;

  const end = total - bottomOffset;
  // Settle the top edge with a chrome row reserved for the `▴` marker when older
  // rows are clipped above (the only marker v1 draws — there is no scroll-up key).
  let start = Math.max(0, end - height);
  for (let pass = 0; pass < 2; pass++) {
    const showAbove = start > 0;
    const contentH = height - (showAbove ? 1 : 0);
    start = Math.max(0, end - contentH);
  }
  const aboveCount = start;
  const showAbove = aboveCount > 0;
  const window = visual.slice(start, end);

  return (
    <Box ref={ref} flexDirection="column">
      {showAbove ? (
        <Text color={tokens.fgDim}>{`${g('moreAbove')} ${aboveCount} more`}</Text>
      ) : null}
      {window.map((row, idx) => (
        <Text key={start + idx} color={tokens.fg} wrap="truncate">
          {row}
        </Text>
      ))}
    </Box>
  );
}

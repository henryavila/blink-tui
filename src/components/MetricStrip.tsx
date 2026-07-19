import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { cellWidth } from '../textWidth.js';
import { useStdoutDimensions } from '../hooks/useStdoutDimensions.js';

/** One live counter. Values are preformatted strings (app owns locale/units). */
export interface MetricItem {
  /** Stable id for React keys and ordering. */
  id: string;
  /** Short label ("done", "elapsed", "rate"). */
  label: string;
  /** Preformatted value ("12/40", "2m 14s", "3.1/s"). */
  value: string;
}

export interface MetricStripProps {
  /**
   * Ordered metrics. Stable order so the eye can track one metric across
   * frames. Trailing metrics drop whole when width is insufficient.
   */
  metrics: MetricItem[];
  /**
   * Max cells for the strip. Defaults to live terminal width. Whole-metric
   * drop from the right (never mid-metric character soup).
   */
  width?: number;
}

/** Rendered width of one metric: `label value` plus optional leading separator. */
function metricWidth(m: MetricItem, withSep: boolean): number {
  // "label value" — one space between
  const body = cellWidth(m.label) + 1 + cellWidth(m.value);
  // " · " separator between metrics
  return body + (withSep ? 3 : 0);
}

/**
 * Pick how many leading metrics fit in `width`, dropping whole trailing items.
 */
export function fitMetrics(metrics: MetricItem[], width: number): MetricItem[] {
  if (metrics.length === 0 || width <= 0) return [];
  const shown: MetricItem[] = [];
  let used = 0;
  for (const m of metrics) {
    const w = metricWidth(m, shown.length > 0);
    if (used + w > width) break;
    used += w;
    shown.push(m);
  }
  return shown;
}

/**
 * A single row of **live metrics** during a run (items done/total, elapsed,
 * throughput). Secondary to {@link StageRail} and {@link ProgressList} — never
 * the only status channel.
 *
 * Values are preformatted strings (app formats numbers/locales). Narrow width
 * drops trailing metrics greedily and predictably. Empty list renders nothing
 * (no empty chrome).
 */
export function MetricStrip({ metrics, width }: MetricStripProps): React.ReactElement | null {
  const tokens = useTokens();
  const { columns } = useStdoutDimensions();
  const budget = Math.max(0, width ?? columns);

  if (metrics.length === 0) return null;

  const shown = fitMetrics(metrics, budget);
  if (shown.length === 0) return null;

  return (
    <Box flexDirection="row" flexShrink={1} overflow="hidden">
      {shown.map((m, i) => (
        <React.Fragment key={m.id}>
          {i > 0 ? (
            <Text color={tokens.fgFaint} wrap="truncate">
              {' · '}
            </Text>
          ) : null}
          <Text color={tokens.fgDim} wrap="truncate">
            {m.label}
          </Text>
          <Text color={tokens.fg} wrap="truncate">
            {' ' + m.value}
          </Text>
        </React.Fragment>
      ))}
    </Box>
  );
}

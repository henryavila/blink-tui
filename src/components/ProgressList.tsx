import React from 'react';
import { Box, Text } from 'ink';
import { useIconSet, useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { glyphColor } from '../glyphs/glyphs.js';
import type { IconSet } from '../glyphs/types.js';
import type { SemanticTokens } from '../theme/tokens.js';
import { cellWidth } from '../textWidth.js';
import { useListWindow } from '../hooks/useListWindow.js';
import { Spinner } from './Spinner.js';

/**
 * The states a {@link ProgressList} line can be in — the execution vocabulary of
 * any apply / migrate / sync / build. Each maps to **intent**, never style: the
 * framework owns the glyph (or the live spinner) and its semantic colour.
 *
 * - `pending` — queued, not started (`◯`, dim).
 * - `running` — executing now → the one sanctioned animation, a {@link Spinner}.
 * - `ok` / `done` — finished cleanly (`✓`, green).
 * - `failed` / `error` — finished badly (`✗`, red).
 * - `waiting` — blocked on a *manual* action and may stay so indefinitely
 *   (`◐`, warn). It reads apart from `running` so a step paused on, say, a device
 *   pairing is legible. (The pause prompt itself is an app `Dialog`, not a
 *   primitive.)
 * - `skipped` — deliberately not run (`◌`, disabled).
 */
export type ProgressState =
  | 'pending'
  | 'running'
  | 'ok'
  | 'done'
  | 'failed'
  | 'error'
  | 'waiting'
  | 'skipped';

/** One step / task in a {@link ProgressList}. Intent only — no glyph, no colour. */
export interface ProgressItem {
  /** Stable identity, used for the active-line lookup and React keys. */
  id: string;
  /** The step's primary text. */
  label: string;
  /** A **registered** domain glyph name → its glyph + owned colour (optional column). */
  domain?: string;
  /** Execution status → the framework draws the glyph / spinner + colour. */
  state: ProgressState;
  /** Right-aligned aside (elapsed time, hint, count …), in `fgDim`. */
  meta?: string;
}

export interface ProgressListProps {
  /** The steps, in execution order. */
  items: ProgressItem[];
  /** Id of the active (executing) line — fills with `bgFocused`, kept in view. */
  activeId?: string | null;
  /**
   * Max lines to render, including any overflow-marker rows. Omit to render every
   * line. When set and `items` exceeds it, the window always contains `activeId`
   * and follows it as it advances — keyboard-paged, like {@link List}.
   */
  height?: number;
  /** Draw `▴ N more` / `▾ N more` on overflowing sides. Default true. */
  overflowMarkers?: boolean;
  /**
   * Advance the running line's spinner. Defaults to true; pass `false` for a
   * static frame (snapshots / non-interactive renders), matching every other
   * blink motion.
   */
  animate?: boolean;
}

/**
 * Per-state glyph NAME + colour token. The four shared marks resolve through the
 * registry (so they degrade with the icon set, like every other glyph); `running`
 * is the spinner and `skipped` is handled inline (see {@link SKIPPED}). This is
 * the ProgressList sibling of `stateIntents` — kept local because its vocabulary
 * (`waiting`, `skipped`) and `pending`→`◯` reading are specific to a job runner.
 */
const PROGRESS_STATES = {
  pending: { glyph: 'circle', token: 'statePending' },
  ok: { glyph: 'check', token: 'stateOk' },
  done: { glyph: 'check', token: 'stateOk' },
  failed: { glyph: 'cross', token: 'stateErr' },
  error: { glyph: 'cross', token: 'stateErr' },
  waiting: { glyph: 'half', token: 'stateWarn' },
} satisfies Record<string, { glyph: string; token: keyof SemanticTokens }>;

/** `◌` "not run" — kept off the Tier-0 registry (the DS treats it as a literal too). */
const SKIPPED = { nerd: '◌', unicode: '◌', ascii: '-' } as const;

/** Resolve a non-registered `{nerd,unicode,ascii}` literal for the active icon set. */
function literalFor(set: IconSet, v: typeof SKIPPED): string {
  return set === 'ascii' ? v.ascii : set === 'unicode' ? v.unicode : v.nerd;
}

/** The label tier for a state: skipped is disabled, pending is muted, the rest are `fg`. */
function labelToken(state: ProgressState): keyof SemanticTokens {
  if (state === 'skipped') return 'fgDisabled';
  if (state === 'pending') return 'fgMuted';
  return 'fg';
}

/** Pad a string to a fixed cell width with background-carrying spaces (see List). */
function cell(s: string, w: number): string {
  return s + ' '.repeat(Math.max(0, w - cellWidth(s)));
}

interface RowMetrics {
  glyphW: number;
  domainW: number;
  showDomain: boolean;
}

/**
 * A single progress line: a status cell (glyph or spinner), the optional domain
 * cell, the label, then the meta pushed to the right edge. The active line fills
 * with `bgFocused`; the fill is a continuous band built the same way as
 * {@link ListRow} — every cell carries the background and a grow-spacer reaches
 * the meta.
 */
function ProgressRow({
  item,
  active,
  metrics,
  animate,
}: {
  item: ProgressItem;
  active: boolean;
  metrics: RowMetrics;
  animate: boolean;
}): React.ReactElement {
  const tokens = useTokens();
  const iconSet = useIconSet();
  const g = useGlyph();
  const bg = active ? tokens.bgFocused : undefined;

  // Status cell — the running line is the spinner; everything else is a glyph.
  let statusCell: React.ReactNode;
  if (item.state === 'running') {
    statusCell = (
      <Text backgroundColor={bg}>
        <Spinner active={animate} />
        {' '.repeat(Math.max(0, metrics.glyphW - 1))}
      </Text>
    );
  } else if (item.state === 'skipped') {
    statusCell = (
      <Text color={tokens.fgDisabled} backgroundColor={bg} wrap="truncate">
        {cell(literalFor(iconSet, SKIPPED), metrics.glyphW)}
      </Text>
    );
  } else {
    const st = PROGRESS_STATES[item.state] ?? null;
    statusCell = (
      <Text color={st ? tokens[st.token] : tokens.fg} backgroundColor={bg} wrap="truncate">
        {cell(st ? g(st.glyph) : '', metrics.glyphW)}
      </Text>
    );
  }

  const domainToken = item.domain ? glyphColor(item.domain) : undefined;
  const domainColor = domainToken ? tokens[domainToken] : tokens.fgMuted;

  return (
    <Box flexDirection="row">
      <Text backgroundColor={bg}> </Text>
      {statusCell}
      <Text backgroundColor={bg}> </Text>
      {metrics.showDomain ? (
        <>
          <Text color={item.domain ? domainColor : tokens.fg} backgroundColor={bg} wrap="truncate">
            {cell(item.domain ? g(item.domain) : '', metrics.domainW)}
          </Text>
          <Text backgroundColor={bg}> </Text>
        </>
      ) : null}
      <Text color={tokens[labelToken(item.state)]} backgroundColor={bg} wrap="truncate">
        {item.label}
      </Text>
      {/* Grow-to-fill spacer carrying the band to the meta / right edge (see ListRow). */}
      <Box flexGrow={1} flexBasis={0} minWidth={0} height={1} overflow="hidden">
        <Text backgroundColor={bg}>{' '.repeat(200)}</Text>
      </Box>
      {item.meta ? (
        <Text color={tokens.fgDim} backgroundColor={bg} wrap="truncate">
          {item.meta}
        </Text>
      ) : null}
      <Text backgroundColor={bg}> </Text>
    </Box>
  );
}

/** The dim `▴ N more` / `▾ N more` chrome row drawn on a clipped side. */
function OverflowMarker({ glyph, count }: { glyph: string; count: number }): React.ReactElement {
  const tokens = useTokens();
  return (
    <Box flexDirection="row">
      <Text> </Text>
      <Text color={tokens.fgFaint}>{`${glyph} ${count} more`}</Text>
    </Box>
  );
}

/**
 * A list of steps that transition through {@link ProgressState}s, with a live
 * {@link Spinner} on the running line — the universal apply / migrate / sync /
 * build view. The complement to {@link ProgressBar}: the bar is the aggregate
 * (compose one above this), this is the per-line detail.
 *
 * INTENT, NOT STYLE: a line carries a `state` (and an optional `domain` name);
 * the framework owns the glyph (or the spinner), its colour, the label tier, the
 * active-line fill, and the `▴/▾` overflow chrome. The consumer never passes a
 * glyph or a colour. The list windows to keep the active line in view, exactly
 * like {@link List}, since a queue is usually taller than its pane.
 */
export function ProgressList({
  items,
  activeId,
  height,
  overflowMarkers = true,
  animate = true,
}: ProgressListProps): React.ReactElement {
  const iconSet = useIconSet();
  const g = useGlyph();

  const showDomain = items.some((it) => it.domain != null);

  // Column widths sized to the widest cell across ALL items (not just the
  // window), so the grid holds steady as wide glyphs scroll through — the same
  // discipline as List. The status column must also fit the spinner (width 1)
  // and the `◌` skipped mark (which, in ascii, is wider than a single cell).
  const glyphW = items.reduce((m, it) => {
    if (it.state === 'running') return Math.max(m, 1);
    if (it.state === 'skipped') return Math.max(m, cellWidth(literalFor(iconSet, SKIPPED)));
    const st = PROGRESS_STATES[it.state] ?? null;
    return Math.max(m, st ? cellWidth(g(st.glyph)) : 1);
  }, 1);
  const domainW = showDomain
    ? items.reduce((m, it) => Math.max(m, it.domain ? cellWidth(g(it.domain)) : 1), 1)
    : 0;
  const metrics: RowMetrics = { glyphW, domainW, showDomain };

  // Window the list, following the active line (like List).
  const activeIndex = activeId == null ? -1 : items.findIndex((it) => it.id === activeId);
  const { start, end, aboveCount, belowCount } = useListWindow({
    rowCount: items.length,
    focusedIndex: activeIndex,
    height: height ?? items.length,
    overflowMarkers,
  });
  const visible = items.slice(start, end);

  const showAbove = overflowMarkers && aboveCount > 0;
  const showBelow = overflowMarkers && belowCount > 0;

  return (
    <Box flexDirection="column">
      {showAbove ? <OverflowMarker glyph={g('moreAbove')} count={aboveCount} /> : null}
      {visible.map((it) => (
        <ProgressRow
          key={it.id}
          item={it}
          active={it.id === activeId}
          metrics={metrics}
          animate={animate}
        />
      ))}
      {showBelow ? <OverflowMarker glyph={g('moreBelow')} count={belowCount} /> : null}
    </Box>
  );
}

import React from 'react';
import { Box, Text } from 'ink';
import { useIconSet, useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { glyph } from '../glyphs/glyphs.js';
import type { SemanticTokens } from '../theme/tokens.js';
import type { IconSet } from '../glyphs/types.js';
import { cellWidth } from '../textWidth.js';
import { useStdoutDimensions } from '../hooks/useStdoutDimensions.js';
import { Spinner } from './Spinner.js';
import type { ProgressState } from './ProgressList.js';

/**
 * One coarse product phase in a multi-stage job. Complements
 * {@link ProgressList}: the rail is **phases** (≈3–8), the list is **steps
 * inside the active phase**.
 *
 * `state` reuses the ProgressList execution vocabulary so apps share one
 * mental model. Prefer a subset: pending / running / ok|done / failed|error /
 * skipped. Unknown states degrade to neutral (no throw).
 */
export interface StageItem {
  /** Stable machine key (app-owned; not shown unless labels collapse). */
  id: string;
  /** Human phase label ("setup", "build"). May be localized by the app. */
  label: string;
  /** Execution intent → framework glyph / spinner + colour. */
  state: ProgressState | string;
}

export interface StageRailProps {
  /** Ordered phases. Keep short (≈3–8); this is orientation, not a task list. */
  stages: StageItem[];
  /**
   * Layout. `horizontal` (default) is a single row for long-run headers;
   * `vertical` fits a side column without requiring a mouse.
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Max cells for the whole rail (horizontal) or each row (vertical). Defaults
   * to live terminal width. Used for progressive degradation.
   */
  width?: number;
  /**
   * Advance the running phase spinner. Defaults to true; pass `false` for
   * snapshots, matching every other blink motion.
   */
  animate?: boolean;
}

/** Per-state glyph + token — aligned with ProgressList, local for rail density. */
const STAGE_STATES = {
  pending: { glyph: 'circle', token: 'statePending' },
  ok: { glyph: 'check', token: 'stateOk' },
  done: { glyph: 'check', token: 'stateOk' },
  failed: { glyph: 'cross', token: 'stateErr' },
  error: { glyph: 'cross', token: 'stateErr' },
  waiting: { glyph: 'half', token: 'stateWarn' },
} satisfies Record<string, { glyph: string; token: keyof SemanticTokens }>;

const SKIPPED = { nerd: '◌', unicode: '◌', ascii: '-' } as const;

function literalFor(set: IconSet, v: typeof SKIPPED): string {
  return set === 'ascii' ? v.ascii : set === 'unicode' ? v.unicode : v.nerd;
}

function labelToken(state: string): keyof SemanticTokens {
  if (state === 'skipped') return 'fgDisabled';
  if (state === 'pending') return 'fgMuted';
  if (state === 'running') return 'fg';
  return 'fg';
}

/** Separator between horizontal stages. */
const SEP = { nerd: ' › ', unicode: ' › ', ascii: ' > ' } as const;

function sepFor(set: IconSet): string {
  return set === 'ascii' ? SEP.ascii : set === 'unicode' ? SEP.unicode : SEP.nerd;
}

type RenderMode = 'full' | 'short' | 'glyphs' | 'overflow';

/** Cell width of the status mark that StageCell will paint for this state. */
function stageMarkWidth(state: string, iconSet: IconSet): number {
  if (state === 'running') return 1; // Spinner frame is always one cell
  if (state === 'skipped') return cellWidth(literalFor(iconSet, SKIPPED));
  const st = STAGE_STATES[state as keyof typeof STAGE_STATES] ?? null;
  if (!st) return 1; // neutral middle-dot
  return cellWidth(glyph(st.glyph, iconSet));
}

/**
 * Pick a degradation mode so the rail stays understandable at narrow widths:
 * full labels → shortened labels → glyphs only → windowed glyphs + "+M more".
 *
 * Returns `visibleCount` (how many stages fit) and `start` (window offset). In
 * overflow mode the window always includes the active stage (running / waiting /
 * failed / error) so orientation is not lost when early phases fall off.
 *
 * Glyph widths are measured for the active icon set (ascii marks like `[x]` are
 * 3 cells — never hardcode 1).
 */
export function pickStageRailMode(
  stages: StageItem[],
  width: number,
  iconSet: IconSet,
): { mode: RenderMode; visibleCount: number; start: number } {
  if (stages.length === 0) return { mode: 'full', visibleCount: 0, start: 0 };
  const sep = sepFor(iconSet);
  const sepW = cellWidth(sep);

  const unitFull = (s: StageItem): number =>
    stageMarkWidth(s.state, iconSet) + 1 + cellWidth(s.label);
  const unitShort = (s: StageItem): number =>
    stageMarkWidth(s.state, iconSet) + 1 + cellWidth(shortLabel(s.label));
  const unitGlyph = (s: StageItem): number => stageMarkWidth(s.state, iconSet);

  const sumUnits = (unit: (s: StageItem) => number): number =>
    stages.reduce((sum, s, i) => sum + unit(s) + (i > 0 ? sepW : 0), 0);

  if (sumUnits(unitFull) <= width) {
    return { mode: 'full', visibleCount: stages.length, start: 0 };
  }
  if (sumUnits(unitShort) <= width) {
    return { mode: 'short', visibleCount: stages.length, start: 0 };
  }
  if (sumUnits(unitGlyph) <= width) {
    return { mode: 'glyphs', visibleCount: stages.length, start: 0 };
  }

  // Overflow: sliding glyph window. Reserve room for both-side markers.
  const markerBudget = cellWidth(`+${stages.length} `) + cellWidth(` +${stages.length}`);
  const contentBudget = Math.max(1, width - markerBudget);

  // Grow window size while the active-including slice still fits contentBudget.
  let bestCount = 1;
  for (let count = 1; count <= stages.length; count++) {
    const winStart = overflowWindowStart(stages, count);
    const slice = stages.slice(winStart, winStart + count);
    let used = 0;
    let fits = true;
    for (let i = 0; i < slice.length; i++) {
      const piece = (i > 0 ? sepW : 0) + unitGlyph(slice[i]!);
      if (used + piece > contentBudget) {
        fits = false;
        break;
      }
      used += piece;
    }
    // Always allow at least one mark even if it exceeds the residual budget.
    if (fits || count === 1) {
      bestCount = count;
      if (!fits) break;
    } else {
      break;
    }
  }

  const visibleCount = Math.max(1, bestCount);
  const start = overflowWindowStart(stages, visibleCount);
  return { mode: 'overflow', visibleCount, start };
}
/** Index of the stage that orientation should not lose (or -1). */
function activeStageIndex(stages: StageItem[]): number {
  const priority = ['running', 'waiting', 'failed', 'error'] as const;
  for (const p of priority) {
    const i = stages.findIndex((s) => s.state === p);
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * Window start so `visibleCount` stages include the active one when possible.
 * Falls back to a trailing window (latest phases) when nothing is active.
 */
export function overflowWindowStart(stages: StageItem[], visibleCount: number): number {
  if (visibleCount >= stages.length) return 0;
  const maxStart = stages.length - visibleCount;
  const active = activeStageIndex(stages);
  if (active < 0) {
    // Nothing active — show the latest phases (where the job is headed).
    return maxStart;
  }
  // Keep active in view: prefer active near the right edge of the window (pipeline reading).
  const start = Math.min(maxStart, Math.max(0, active - visibleCount + 1));
  return start;
}

/** Shorten a label by cell width (not JS string length) so CJK/emoji stay fair. */
function shortLabel(label: string): string {
  if (cellWidth(label) <= 4) return label;
  let out = '';
  for (const ch of label) {
    if (cellWidth(out + ch) > 3) break;
    out += ch;
  }
  return out.length > 0 ? out : label.slice(0, 1);
}
/**
 * Coarse **pipeline orientation**: a short ordered set of product phases and
 * which is pending, running, done, failed, or skipped. Always visible during
 * long runs so the human knows "where we are" without reading the log.
 *
 * Complements — does not replace — {@link ProgressList} (rail = phases, list =
 * steps inside the active phase). Presentational only; apps map structured
 * events → phase id/state.
 *
 * Horizontal width degradation: full labels → short labels → glyphs only →
 * "+N more". Vertical mode stacks one phase per row for side columns.
 */
export function StageRail({
  stages,
  orientation = 'horizontal',
  width,
  animate = true,
}: StageRailProps): React.ReactElement {
  const tokens = useTokens();
  const iconSet = useIconSet();
  const g = useGlyph();
  const { columns } = useStdoutDimensions();
  const budget = Math.max(1, width ?? columns);

  if (stages.length === 0) {
    return <Box />;
  }

  if (orientation === 'vertical') {
    return (
      <Box flexDirection="column">
        {stages.map((s) => (
          <StageCell
            key={s.id}
            stage={s}
            mode="full"
            animate={animate}
            g={g}
            iconSet={iconSet}
            tokens={tokens}
          />
        ))}
      </Box>
    );
  }

  const { mode, visibleCount, start } = pickStageRailMode(stages, budget, iconSet);
  const visible = stages.slice(start, start + visibleCount);
  const hiddenBefore = start;
  const hiddenAfter = stages.length - (start + visible.length);
  const sep = sepFor(iconSet);

  return (
    <Box flexDirection="row" flexShrink={1} overflow="hidden">
      {mode === 'overflow' && hiddenBefore > 0 ? (
        <Text color={tokens.fgFaint} wrap="truncate">
          {`+${hiddenBefore} `}
        </Text>
      ) : null}
      {visible.map((s, i) => (
        <React.Fragment key={s.id}>
          {i > 0 ? (
            <Text color={tokens.fgFaint} wrap="truncate">
              {sep}
            </Text>
          ) : null}
          <StageCell
            stage={s}
            mode={mode === 'overflow' ? 'glyphs' : mode}
            animate={animate}
            g={g}
            iconSet={iconSet}
            tokens={tokens}
          />
        </React.Fragment>
      ))}
      {mode === 'overflow' && hiddenAfter > 0 ? (
        <Text color={tokens.fgFaint} wrap="truncate">
          {` +${hiddenAfter}`}
        </Text>
      ) : null}
    </Box>
  );
}

function StageCell({
  stage,
  mode,
  animate,
  g,
  iconSet,
  tokens,
}: {
  stage: StageItem;
  mode: 'full' | 'short' | 'glyphs';
  animate: boolean;
  g: (name: string) => string;
  iconSet: IconSet;
  tokens: SemanticTokens;
}): React.ReactElement {
  const state = stage.state;
  let glyphNode: React.ReactNode;

  if (state === 'running') {
    glyphNode = <Spinner active={animate} />;
  } else if (state === 'skipped') {
    glyphNode = (
      <Text color={tokens.fgDisabled} wrap="truncate">
        {literalFor(iconSet, SKIPPED)}
      </Text>
    );
  } else {
    const st = STAGE_STATES[state as keyof typeof STAGE_STATES] ?? null;
    glyphNode = (
      <Text color={st ? tokens[st.token] : tokens.fgDim} wrap="truncate">
        {st ? g(st.glyph) : '·'}
      </Text>
    );
  }

  if (mode === 'glyphs') {
    return <Box flexShrink={0}>{glyphNode}</Box>;
  }

  const text = mode === 'short' ? shortLabel(stage.label) : stage.label;
  return (
    <Box flexDirection="row" flexShrink={0} gap={1}>
      {glyphNode}
      <Text color={tokens[labelToken(state)]} wrap="truncate">
        {text}
      </Text>
    </Box>
  );
}

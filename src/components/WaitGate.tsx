import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import type { SemanticTokens } from '../theme/tokens.js';
import type { HotkeyDef } from './Footer.js';
import { KeyHints } from './KeyHints.js';
import { LinkPanel, type LinkDetail } from './LinkPanel.js';

/**
 * Why the machine is idle on purpose. Distinct from a short `running` spinner
 * step: this is an **indefinite human wait** (external tool, device, second
 * surface). Domain-neutral intent — apps map product events onto these.
 *
 * - `waiting` — blocked; human has not finished the external action.
 * - `ready` — external action complete; safe to continue.
 * - `failed` — external action failed or timed out (app decides timeout).
 * - `done` — external step finished (alias of success lifecycle; same paint as ready).
 */
export type WaitGateStatus = 'waiting' | 'ready' | 'failed' | 'done';

export interface WaitGateProps {
  /** Short title: what we are waiting for ("waiting for human action"). */
  title: string;
  /**
   * Lifecycle intent. Must read apart from a ProgressList `running` step —
   * waiting is idle-on-purpose, not machine work. Unknown → neutral.
   */
  status?: WaitGateStatus | string;
  /**
   * Free-text status copy the app owns. When omitted, a calm default is shown
   * for known intents only (still domain-neutral: "waiting", "ready", "failed").
   */
  statusLabel?: string;
  /**
   * Optional primary destination. When set, renders via {@link LinkPanel} so
   * there is one URL surface in the design system, not two.
   */
  href?: string;
  /** Optional detail rows under the destination (host, port, …). */
  details?: LinkDetail[];
  /**
   * Elapsed wait, **app-fed** as a fully preformatted string (e.g. `"2m 14s"`
   * or `"elapsed 2m 14s"`). blink renders it as-is — no prefix, no timer.
   * Prefer app-fed clocks for testability and i18n.
   */
  elapsed?: string;
  /**
   * Suggested continue / open / copy chips — display only. Prefer de-duping
   * against the global {@link Footer}.
   */
  hints?: HotkeyDef[];
  /** Pin LinkPanel href budget (tests / narrow panes). */
  width?: number;
}

const WAIT_STATUS: Record<
  WaitGateStatus,
  { glyph: string; token: keyof SemanticTokens; defaultLabel: string }
> = {
  waiting: { glyph: 'half', token: 'stateWarn', defaultLabel: 'waiting' },
  ready: { glyph: 'check', token: 'stateOk', defaultLabel: 'ready' },
  failed: { glyph: 'cross', token: 'stateErr', defaultLabel: 'failed' },
  done: { glyph: 'check', token: 'stateOk', defaultLabel: 'done' },
};

function resolveWait(status: string | undefined): (typeof WAIT_STATUS)[WaitGateStatus] | null {
  if (status == null) return null;
  return WAIT_STATUS[status as WaitGateStatus] ?? null;
}

/**
 * Express "we are **blocked on a human action that may take minutes**" without
 * looking crashed or still running work. Distinct from a short spinner step
 * and from machine `running` progress.
 *
 * Composition (canonical handoff screen): title + status, optional
 * {@link LinkPanel} for the primary target, optional elapsed, optional local
 * key hints. No auto-continue, no side effects, no motion timers — one
 * animation budget stays with {@link Spinner} elsewhere.
 *
 * Consumer owns: detecting external completion, timeout policy, open/copy keys.
 */
export function WaitGate({
  title,
  status,
  statusLabel,
  href,
  details,
  elapsed,
  hints = [],
  width,
}: WaitGateProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();
  // Default intent when omitted: waiting (the gate's purpose). Pass an unknown
  // string or only statusLabel for a fully neutral paint without a glyph.
  const resolvedStatus = status ?? 'waiting';
  const st = resolveWait(resolvedStatus);
  const label = statusLabel ?? st?.defaultLabel;

  // When an href is present, LinkPanel owns title + status + details + hints so
  // we do not double-paint the destination. WaitGate adds only the wait frame
  // (elapsed + the semantic distinction that this is a gate, not a footnote).
  if (href) {
    return (
      <Box flexDirection="column">
        <LinkPanel
          title={title}
          href={href}
          status={resolvedStatus}
          statusLabel={label}
          details={details}
          hints={hints}
          width={width}
        />
        {elapsed ? (
          <Text color={tokens.fgFaint} wrap="truncate">
            {elapsed}
          </Text>
        ) : null}
      </Box>
    );
  }

  // No href: wait can be non-URL ("insert device", "confirm offline").
  return (
    <Box flexDirection="column">
      <Box flexDirection="row" gap={1}>
        {st ? (
          <Text color={tokens[st.token]} wrap="truncate">
            {g(st.glyph)}
          </Text>
        ) : null}
        <Text color={tokens.fg} wrap="truncate">
          {title}
        </Text>
      </Box>
      {label ? (
        <Text color={tokens.fgMuted} wrap="truncate">
          {label}
        </Text>
      ) : null}
      {elapsed ? (
        <Text color={tokens.fgFaint} wrap="truncate">
          {elapsed}
        </Text>
      ) : null}
      {details && details.length > 0 ? (
        <Box flexDirection="column" marginTop={1}>
          {details.map((d, i) => (
            <Box key={`${d.label}:${d.value}:${i}`} flexDirection="row" gap={1}>
              <Box width={8} flexShrink={0}>
                <Text color={tokens.fgDim} wrap="truncate">
                  {d.label}
                </Text>
              </Box>
              <Text color={tokens.fg} wrap="truncate">
                {d.value}
              </Text>
            </Box>
          ))}
        </Box>
      ) : null}
      {hints.length > 0 ? (
        <Box marginTop={1}>
          <KeyHints keys={hints} width={width} />
        </Box>
      ) : null}
    </Box>
  );
}

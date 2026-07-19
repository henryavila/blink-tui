import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import type { SemanticTokens } from '../theme/tokens.js';
import { cellWidth } from '../textWidth.js';
import { useStdoutDimensions } from '../hooks/useStdoutDimensions.js';
import type { HotkeyDef } from './Footer.js';
import { KeyHints } from './KeyHints.js';

/**
 * Lifecycle of an external destination the human must open outside the
 * terminal. Domain-neutral **intent** only — the app maps its own events
 * onto these four values; blink never learns product vocabulary. Unknown
 * values degrade to neutral (no throw).
 *
 * - `waiting` — destination not ready yet (or human has not acted).
 * - `ready` — safe to open / continue.
 * - `failed` — destination unavailable or the handoff aborted.
 * - `done` — human finished the external step.
 */
export type LinkStatus = 'waiting' | 'ready' | 'failed' | 'done';

/** One optional detail row under the primary target (host, port, pid …). */
export interface LinkDetail {
  /** Short label in the gutter (`fgDim`). */
  label: string;
  /** Value text (`fg`). */
  value: string;
}

export interface LinkPanelProps {
  /**
   * Short command-voice title — "open docs", "link ready" — not a full
   * sentence paragraph. Rendered as the panel's primary heading.
   */
  title: string;
  /**
   * The single primary destination string (URL, deep link, path). Always the
   * dominant line. Truncated with a trailing ellipsis when it cannot fit.
   */
  href: string;
  /**
   * Lifecycle intent → framework glyph + colour. Omit for a neutral panel with
   * no status cell. Unknown strings degrade to neutral (no throw).
   */
  status?: LinkStatus | string;
  /**
   * Free-text status line the app owns (i18n / product copy). When set with a
   * known `status`, the glyph still comes from the intent; the label is the
   * human text. When set without `status`, rendered muted with no glyph.
   */
  statusLabel?: string;
  /** Secondary facts under the target (host, port, pid …) — never compete with `href`. */
  details?: LinkDetail[];
  /**
   * Suggested key chips near the panel — pure display, never bound. Same shape
   * as {@link Footer} chips so apps can share a list and de-dupe.
   */
  hints?: HotkeyDef[];
  /**
   * Max cells for the primary target line. Defaults to the live terminal width
   * minus a small gutter. Pass a fixed width in tests / tight panes.
   */
  width?: number;
}

/** Intent → glyph name + colour token. Local map; unknown → null (neutral). */
const LINK_STATUS: Record<
  LinkStatus,
  { glyph: string; token: keyof SemanticTokens }
> = {
  waiting: { glyph: 'half', token: 'stateWarn' },
  ready: { glyph: 'check', token: 'stateOk' },
  failed: { glyph: 'cross', token: 'stateErr' },
  done: { glyph: 'check', token: 'stateOk' },
};

function resolveStatus(status: string | undefined): (typeof LINK_STATUS)[LinkStatus] | null {
  if (status == null) return null;
  return LINK_STATUS[status as LinkStatus] ?? null;
}

/**
 * Truncate a string to `max` cells, preferring to break at `/`, `?`, or `#`
 * so a mid-token clip is avoided when a later separator still fits. Always
 * ends with `…` when truncated.
 */
export function truncateHref(href: string, max: number): string {
  if (max <= 0) return '';
  if (cellWidth(href) <= max) return href;
  if (max === 1) return '…';
  const budget = max - 1; // reserve for ellipsis
  // Prefer keeping a prefix that ends on a URL separator.
  let best = '';
  let acc = '';
  for (const ch of href) {
    const next = acc + ch;
    if (cellWidth(next) > budget) break;
    acc = next;
    if (ch === '/' || ch === '?' || ch === '#' || ch === '&') best = acc;
  }
  const keep = best.length > 0 && cellWidth(best) >= Math.min(8, budget) ? best : acc;
  // If we got nothing useful, hard-slice by cell budget.
  if (keep.length === 0) {
    let hard = '';
    for (const ch of href) {
      if (cellWidth(hard + ch) > budget) break;
      hard += ch;
    }
    return hard + '…';
  }
  return keep + '…';
}

/**
 * Present the **single primary destination** a human must use outside the
 * terminal (URL, deep link, path, docs page), with lifecycle status and
 * optional secondary facts — so the eye always finds "what do I open?".
 *
 * INTENT, NOT STYLE: the consumer passes `status` intent + free `statusLabel`
 * copy; blink owns glyph and colour. Purely presentational: no `useInput`, no
 * clipboard, no `open`. Apps own keys and side effects.
 *
 * Complements {@link WaitGate} (the full handoff wait screen) and
 * {@link DescriptionList} (dense facts without a primary href).
 */
export function LinkPanel({
  title,
  href,
  status,
  statusLabel,
  details = [],
  hints = [],
  width,
}: LinkPanelProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();
  const { columns } = useStdoutDimensions();
  const st = resolveStatus(status);

  // Leave a 2-cell left pad budget so the href never butts the pane edge when
  // composed inside a Pane; tests can pin `width` explicitly.
  const hrefBudget = Math.max(1, width ?? columns - 2);
  const shownHref = truncateHref(href, hrefBudget);

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

      <Box flexDirection="row">
        <Text color={tokens.accent} wrap="truncate">
          {shownHref}
        </Text>
      </Box>

      {statusLabel ? (
        <Text color={tokens.fgMuted} wrap="truncate">
          {statusLabel}
        </Text>
      ) : null}

      {details.length > 0 ? (
        <Box flexDirection="column" marginTop={1}>
          {details.map((d, i) => (
            <Box key={i} flexDirection="row" gap={1}>
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
          <KeyHints keys={hints} width={hrefBudget} />
        </Box>
      ) : null}
    </Box>
  );
}

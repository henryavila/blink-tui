import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { List, type ListRowData } from './List.js';

/** One candidate in a dense multi-option pick. Maps 1:1 onto {@link ListRowData}. */
export interface ChoiceItem {
  id: string;
  /** Primary label. */
  label: string;
  /** Secondary meta (duration, size, path tail) — right-aligned, secondary. */
  meta?: string;
  /** Optional semantic state name for the state column (framework paints it). */
  state?: string;
  /** Optional registered domain glyph name. */
  domain?: string;
  /** De-emphasise a disabled / unavailable candidate. */
  muted?: boolean;
}

export interface ChoicePickerProps {
  /** Candidates in display order. App sorts before pass-in — no domain sort here. */
  choices: ChoiceItem[];
  /** Focused row id (app-fed). Confirm is external — focus change never confirms. */
  focusedId?: string | null;
  /**
   * Max rows including overflow markers. Omit to render every row. Windowing
   * reuses {@link List} + {@link useListWindow}.
   */
  height?: number;
  /** Context rows before the window scrolls. Default 0. */
  scrolloff?: number;
  /** Draw ▴/▾ N more markers. Default true. */
  overflowMarkers?: boolean;
  /**
   * Empty-state message intent when `choices` is empty. Domain-neutral default:
   * "no candidates". App may pass localized copy.
   */
  emptyMessage?: string;
  /**
   * Optional pointer that free-text is available elsewhere (e.g. the app will
   * switch to {@link GuidedPrompt}). Display only.
   */
  freeTextHint?: string;
}

/**
 * Dense **multi-candidate pick** when many options share one decision. Thin
 * standardisation over {@link List}: single-select semantics (focus only;
 * confirm is app-owned), explicit empty state, optional free-text affordance
 * pointer. The app sorts and labels candidates — blink does not.
 *
 * Prefer this over ad-hoc List wiring when the screen is "pick one of N" with
 * secondary meta. For one-question dialogue with defaults, use
 * {@link GuidedPrompt}.
 */
export function ChoicePicker({
  choices,
  focusedId = null,
  height,
  scrolloff,
  overflowMarkers = true,
  emptyMessage = 'no candidates',
  freeTextHint,
}: ChoicePickerProps): React.ReactElement {
  const tokens = useTokens();

  if (choices.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color={tokens.fgMuted} wrap="truncate">
          {emptyMessage}
        </Text>
        {freeTextHint ? (
          <Text color={tokens.fgFaint} wrap="truncate">
            {freeTextHint}
          </Text>
        ) : null}
      </Box>
    );
  }

  const rows: ListRowData[] = choices.map((c) => ({
    id: c.id,
    label: c.label,
    meta: c.meta,
    state: c.state,
    domain: c.domain,
    muted: c.muted,
  }));

  return (
    <Box flexDirection="column">
      <List
        rows={rows}
        focusedId={focusedId}
        height={height}
        scrolloff={scrolloff}
        overflowMarkers={overflowMarkers}
      />
      {freeTextHint ? (
        <Text color={tokens.fgFaint} wrap="truncate">
          {freeTextHint}
        </Text>
      ) : null}
    </Box>
  );
}

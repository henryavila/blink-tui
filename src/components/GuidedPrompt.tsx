import React, { useCallback, useState } from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { Input } from './CursorInput.js';

/** One selectable answer in a guided single-question flow. */
export interface GuidedChoice {
  /** Stable id the app maps to pipeline state. */
  id: string;
  /** Human label shown in the list. */
  label: string;
  /** Optional right-aligned aside (size, path tail, duration). */
  meta?: string;
}

export interface GuidedPromptProps {
  /** The single question, command voice. */
  question: string;
  /**
   * Controlled current value (choice id or free-text). The app owns state;
   * re-renders with a new `value` never fight user-owned state inside blink.
   */
  value?: string;
  /**
   * Default when `value` is empty — Enter-to-accept affordance. When `choices`
   * are present, treat this as a **choice id** (selection highlight + label
   * lookup); free-text-only prompts may pass any string.
   */
  defaultValue?: string;
  /** Optional fixed set of answers. Empty / omitted → free path only when allowed. */
  choices?: GuidedChoice[];
  /**
   * Id of the focused choice row (app-fed). When omitted and choices exist,
   * none is focused — pure presentational.
   */
  focusedId?: string | null;
  /** Allow a free-text answer via presentational {@link Input}. Default false. */
  allowFreeText?: boolean;
  /** Placeholder for free-text mode. */
  placeholder?: string;
  /** Inline non-modal error under the prompt. */
  error?: string;
  /** Soft busy state — dims the body; app still owns keys / confirm. */
  busy?: boolean;
  /**
   * When true and a `value` is set, render a stable "resolved answer" line for
   * logging / non-interactive assume-yes paths. Default false.
   */
  resolved?: boolean;
  /** Whether the free-text field draws focus chrome. App-fed. */
  inputFocused?: boolean;
  /** Caret index for free-text (0..value.length). App-fed. */
  cursor?: number;
}

export interface UseGuidedPromptNavigationOptions {
  /** Ordered choice ids. */
  ids: string[];
  /** Controlled focus. Omit to let the hook own it (seeded to first id). */
  focusedId?: string | null;
  onFocusChange?: (id: string) => void;
  /** Wrap first↔last. Default false. */
  wrap?: boolean;
}

export interface GuidedPromptNavigation {
  focusedId: string | null;
  focusedIndex: number;
  focusNext: () => void;
  focusPrev: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  focusTo: (id: string) => void;
  /** The focused choice id (or null) — app maps Enter → confirm this. */
  confirmTarget: string | null;
}

/**
 * Headless next/prev choice focus for {@link GuidedPrompt}. Keys stay app-owned:
 * wire `useInput` to these methods. Mirrors {@link useListNavigation} so apps
 * can share muscle memory with List pickers.
 */
export function useGuidedPromptNavigation(
  opts: UseGuidedPromptNavigationOptions,
): GuidedPromptNavigation {
  const { ids, focusedId: controlled, onFocusChange, wrap = false } = opts;
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState<string | null>(() => ids[0] ?? null);

  // Derive a focus that always lands in `ids`. Stale internal/controlled ids
  // (choice set changed) fall back to the first option — no setState-in-render.
  const rawFocus = isControlled ? (controlled ?? null) : internal;
  const focusedId =
    rawFocus != null && ids.includes(rawFocus) ? rawFocus : (ids[0] ?? null);
  const focusedIndex = focusedId == null ? -1 : ids.indexOf(focusedId);

  const setFocus = useCallback(
    (id: string | null) => {
      if (id == null) return;
      if (!isControlled) setInternal(id);
      onFocusChange?.(id);
    },
    [isControlled, onFocusChange],
  );

  const move = useCallback(
    (delta: number) => {
      if (ids.length === 0) return;
      const cur = focusedIndex < 0 ? 0 : focusedIndex;
      let next = cur + delta;
      if (wrap) next = ((next % ids.length) + ids.length) % ids.length;
      else next = Math.max(0, Math.min(ids.length - 1, next));
      setFocus(ids[next] ?? null);
    },
    [ids, focusedIndex, wrap, setFocus],
  );

  return {
    focusedId,
    focusedIndex,
    focusNext: () => move(1),
    focusPrev: () => move(-1),
    focusFirst: () => setFocus(ids[0] ?? null),
    focusLast: () => setFocus(ids[ids.length - 1] ?? null),
    focusTo: (id: string) => setFocus(id),
    confirmTarget: focusedId,
  };
}

/**
 * One **question at a time** with a default, optional choices, and optional free
 * text — the dialogue pattern for guided multi-phase flows. Not a full
 * multi-field {@link Form}.
 *
 * INTENT, NOT STYLE: controlled `value`, app-fed `focusedId`, no domain
 * precedence, no `-y` hardcoding. Purely presentational; optional
 * {@link useGuidedPromptNavigation} for headless next/prev/confirm targeting.
 */
export function GuidedPrompt({
  question,
  value = '',
  defaultValue,
  choices = [],
  focusedId = null,
  allowFreeText = false,
  placeholder,
  error,
  busy = false,
  resolved = false,
  inputFocused = false,
  cursor,
}: GuidedPromptProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();

  const hasChoices = choices.length > 0;
  /** Resolve a free/id value to a human label when it matches a choice id. */
  const labelOf = (raw: string): string =>
    choices.find((c) => c.id === raw)?.label ?? raw;
  const displayValue = value || defaultValue || '';
  const displayLabel = displayValue ? labelOf(displayValue) : '';

  if (resolved && displayLabel) {
    return (
      <Box flexDirection="column">
        <Text color={tokens.fgMuted} wrap="truncate">
          {question}
        </Text>
        <Box flexDirection="row" gap={1}>
          <Text color={tokens.stateOk}>{g('check')}</Text>
          <Text color={tokens.fg} wrap="truncate">
            {displayLabel}
          </Text>
        </Box>
      </Box>
    );
  }

  const bodyColor = busy ? tokens.fgDisabled : tokens.fg;
  const defaultLabel =
    defaultValue != null && defaultValue !== ''
      ? labelOf(defaultValue)
      : '';

  return (
    <Box flexDirection="column">
      <Text color={bodyColor} wrap="truncate">
        {question}
      </Text>

      {defaultValue && !value ? (
        <Text color={tokens.fgFaint} wrap="truncate">
          {'default · ' + defaultLabel}
        </Text>
      ) : null}

      {/* Free-text mode already shows the value in Input — do not echo it. */}
      {value && !hasChoices && !allowFreeText ? (
        <Text color={tokens.fgMuted} wrap="truncate">
          {labelOf(value)}
        </Text>
      ) : null}

      {hasChoices ? (
        <Box flexDirection="column" marginTop={1}>
          {choices.map((c, i) => {
            const focused = c.id === focusedId;
            // Selection is by id; defaultValue is treated as a choice id when it matches.
            const selected = value === c.id || (!value && defaultValue === c.id);
            const bg = focused ? tokens.bgFocused : undefined;
            return (
              <Box key={c.id} flexDirection="row">
                <Text backgroundColor={bg} color={focused ? tokens.accent : tokens.fgDim}>
                  {focused ? g('focus') + ' ' : '  '}
                </Text>
                <Text backgroundColor={bg} color={tokens.fgDim} wrap="truncate">
                  {String(i + 1) + '. '}
                </Text>
                <Text
                  backgroundColor={bg}
                  color={selected ? tokens.fg : bodyColor}
                  wrap="truncate"
                >
                  {c.label}
                </Text>
                {selected ? (
                  <Text backgroundColor={bg} color={tokens.accent} wrap="truncate">
                    {' ·'}
                  </Text>
                ) : null}
                <Box flexGrow={1} flexBasis={0} minWidth={0} height={1} overflow="hidden">
                  <Text backgroundColor={bg}>{' '.repeat(200)}</Text>
                </Box>
                {c.meta ? (
                  <Text backgroundColor={bg} color={tokens.fgDim} wrap="truncate">
                    {c.meta}
                  </Text>
                ) : null}
              </Box>
            );
          })}
        </Box>
      ) : null}

      {allowFreeText ? (
        <Box marginTop={hasChoices ? 1 : 0}>
          <Input
            value={value}
            cursor={cursor}
            placeholder={placeholder ?? defaultValue ?? ''}
            focused={inputFocused}
            error={error}
          />
        </Box>
      ) : error ? (
        <Box flexDirection="row" marginTop={1}>
          <Text color={tokens.stateErr}>{g('cross')}</Text>
          <Text color={tokens.fgMuted}>{' ' + error}</Text>
        </Box>
      ) : null}
    </Box>
  );
}

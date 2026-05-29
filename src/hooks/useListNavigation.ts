import { useCallback, useState } from 'react';

export interface UseListNavigationOptions {
  /** Ordered row ids. */
  ids: string[];
  /** Controlled focus. Omit to let the hook own it (seeded to the first id). */
  focusedId?: string | null;
  onFocusChange?: (id: string) => void;
  /** Wrap first↔last instead of clamping at the ends. Default false. */
  wrap?: boolean;
}

export interface ListNavigation {
  focusedId: string | null;
  /** Index of `focusedId` in `ids` (`-1` when none) — feed to {@link useListWindow}. */
  focusedIndex: number;
  focusNext: () => void;
  focusPrev: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  focusTo: (id: string) => void;
}

/**
 * Headless focus movement for a list — clamp/wrap at the ends, next/prev/first/
 * last/seek. Exposes **intent methods**, never a baked-in key handler: the app
 * owns `useInput` and maps its own keys (`j/k`, arrows, …) to these, so blink
 * never embeds one app's keymap. Separate from {@link useListSelection} because
 * focus movement is generic to any list, including read-only menus that never
 * select.
 *
 * ```tsx
 * const nav = useListNavigation({ ids });
 * useInput((_, key) => {
 *   if (key.downArrow) nav.focusNext();
 *   if (key.upArrow) nav.focusPrev();
 * });
 * <List rows={rows} focusedId={nav.focusedId} height={20} />
 * ```
 */
export function useListNavigation(opts: UseListNavigationOptions): ListNavigation {
  const { ids, focusedId: controlled, onFocusChange, wrap = false } = opts;
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState<string | null>(() => ids[0] ?? null);

  const focusedId = isControlled ? controlled : internal;
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
  };
}

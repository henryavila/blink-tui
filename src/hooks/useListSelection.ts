import { useCallback, useState } from 'react';

export type SelectionMode = 'single' | 'multi';

export interface UseListSelectionOptions {
  /** The selectable row ids (used for bounds only; selection is by id). */
  ids: string[];
  /** `'single'` keeps exactly one selected; `'multi'` toggles a subset. */
  mode: SelectionMode;
  /** multi/single: minimum that must stay selected — deselecting below is blocked. */
  min?: number;
  /** multi: maximum selectable — selecting above is blocked. */
  max?: number;
  /** Initially selected ids. */
  initial?: Iterable<string>;
  onChange?: (selected: Set<string>) => void;
}

export interface ListSelection {
  /** Feed straight to `<List selectedIds={...} />`. */
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  /** Toggle `id`. Returns `false` when blocked by `min`/`max` (and sets `blocked`). */
  toggle: (id: string) => boolean;
  /** Single-select: make `id` the only selected row. */
  selectOnly: (id: string) => void;
  /** Clear all (blocked when `min` would be violated). */
  clear: () => void;
  /** True when the last operation was blocked by `min`/`max` — render as `Input.error`. */
  blocked: boolean;
}

/**
 * Headless selection logic for a list — the toggle, the single-select
 * invariant, and the min/max guards that every consumer otherwise hand-rolls.
 * It owns the selected `Set`; the **app still owns the keys** and renders the
 * existing presentational {@link List}. Pair with {@link useListNavigation} for
 * the cursor; this hook is only about *what is selected*.
 *
 * ```tsx
 * const sel = useListSelection({ ids, mode: 'multi', min: 1 });
 * useInput((input) => { if (input === ' ' && focusedId) sel.toggle(focusedId); });
 * <List rows={rows} selectedIds={sel.selectedIds} focusedId={focusedId} />
 * ```
 */
export function useListSelection(opts: UseListSelectionOptions): ListSelection {
  const { mode, min, max, initial, onChange } = opts;
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial ?? []));
  const [blocked, setBlocked] = useState(false);

  const commit = useCallback(
    (next: Set<string>) => {
      setBlocked(false);
      setSelected(next);
      onChange?.(next);
    },
    [onChange],
  );

  const block = useCallback((): false => {
    setBlocked(true);
    return false;
  }, []);

  const toggle = useCallback(
    (id: string): boolean => {
      const has = selected.has(id);
      if (mode === 'single') {
        if (has) {
          if (min !== undefined && min > 0) return block(); // can't drop the only selection
          commit(new Set());
          return true;
        }
        commit(new Set([id]));
        return true;
      }
      // multi
      if (has) {
        if (min !== undefined && selected.size <= min) return block();
        const next = new Set(selected);
        next.delete(id);
        commit(next);
        return true;
      }
      if (max !== undefined && selected.size >= max) return block();
      const next = new Set(selected);
      next.add(id);
      commit(next);
      return true;
    },
    [selected, mode, min, max, commit, block],
  );

  const selectOnly = useCallback((id: string) => commit(new Set([id])), [commit]);

  const clear = useCallback(() => {
    if (min !== undefined && min > 0) {
      block();
      return;
    }
    commit(new Set());
  }, [min, commit, block]);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  return { selectedIds: selected, isSelected, toggle, selectOnly, clear, blocked };
}

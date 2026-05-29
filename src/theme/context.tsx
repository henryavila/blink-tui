import React, { createContext, useContext, useMemo, useState } from 'react';
import type { IconSet } from '../glyphs/types.js';
import type { SemanticTokens } from './tokens.js';
import type { Theme, ThemeMeta } from './theme.js';
import { defaultTheme, getTheme, listThemes } from './theme.js';

/**
 * What every blink app reads from context: the active {@link Theme}, the
 * resolved {@link IconSet}, and the controls to switch theme. The theme is the
 * one mutable piece of the surface — exactly like a terminal emulator's scheme.
 * The icon set is decided once at boot.
 */
export interface BlinkContextValue {
  theme: Theme;
  iconSet: IconSet;
  /** Switch the active theme by id or by a {@link Theme} object. */
  setTheme: (theme: string | Theme) => void;
  /** Every registered theme's picker metadata, in order. */
  themes: ThemeMeta[];
}

const BlinkContext = createContext<BlinkContextValue>({
  theme: defaultTheme,
  iconSet: 'unicode',
  setTheme: () => {},
  themes: listThemes(),
});

export interface ThemeProviderProps {
  /**
   * The initial theme — a {@link Theme} object or a registered theme id. When
   * omitted, blink starts on its default (`tokyonight`). Components read the
   * *active* theme, which a picker can switch via `useThemeControls()`.
   */
  theme?: Theme | string;
  /** @deprecated alias of {@link theme} when passing an id. */
  initialTheme?: string;
  /**
   * Resolved icon set. Pass the result of `detectIconSet()` (awaited at boot).
   * Defaults to `'unicode'` — the safe mode that renders everywhere.
   */
  iconSet?: IconSet;
  children: React.ReactNode;
}

function resolveTheme(t: Theme | string | undefined): Theme {
  if (t == null) return defaultTheme;
  return typeof t === 'string' ? getTheme(t) : t;
}

/**
 * Wrap a blink app once, at the root, above `<App/>` — the surface that owns the
 * colour scheme:
 *
 * ```tsx
 * const iconSet = await detectIconSet();
 * render(
 *   <ThemeProvider iconSet={iconSet} theme="tokyonight">
 *     <App />
 *   </ThemeProvider>
 * );
 * ```
 *
 * The provider holds the active theme in state; a theme picker calls
 * `useThemeControls().setTheme(id)` and the whole tree recolours from the new
 * tokens. No component sets, reads, or branches on the theme — consistency is
 * structural, not a matter of discipline.
 */
export function ThemeProvider({
  theme,
  initialTheme,
  iconSet = 'unicode',
  children,
}: ThemeProviderProps): React.ReactElement {
  const [active, setActive] = useState<Theme>(() => resolveTheme(theme ?? initialTheme));

  const value = useMemo<BlinkContextValue>(
    () => ({
      theme: active,
      iconSet,
      setTheme: (t) => setActive(resolveTheme(t)),
      themes: listThemes(),
    }),
    [active, iconSet],
  );
  return <BlinkContext.Provider value={value}>{children}</BlinkContext.Provider>;
}

/** Full context: `{ theme, iconSet, setTheme, themes }`. */
export function useBlink(): BlinkContextValue {
  return useContext(BlinkContext);
}

/** The active theme. */
export function useTheme(): Theme {
  return useContext(BlinkContext).theme;
}

/** Just the semantic tokens — the common case in components. */
export function useTokens(): SemanticTokens {
  return useContext(BlinkContext).theme.tokens;
}

/** The resolved icon set (`'nerd' | 'unicode' | 'ascii'`). */
export function useIconSet(): IconSet {
  return useContext(BlinkContext).iconSet;
}

/** The theme switch + list — what a theme picker drives. */
export interface ThemeControls {
  /** The active theme. */
  theme: Theme;
  /** The active theme's id. */
  themeId: string;
  /** Switch theme by id or {@link Theme}. */
  setTheme: (theme: string | Theme) => void;
  /** Every registered theme's metadata, in picker order. */
  themes: ThemeMeta[];
}

/**
 * The theme controls for a picker — the TUI analogue of the design system's
 * `BlinkTheme.setTheme / getTheme / THEMES`. The picker is the *only* place that
 * should switch the theme; ordinary components just read {@link useTokens}.
 */
export function useThemeControls(): ThemeControls {
  const { theme, setTheme, themes } = useContext(BlinkContext);
  return { theme, themeId: theme.id, setTheme, themes };
}

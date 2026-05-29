import React, { createContext, useContext, useMemo } from 'react';
import type { IconSet } from '../glyphs/types.js';
import type { SemanticTokens } from './tokens.js';
import type { Theme } from './theme.js';
import { defaultTheme } from './theme.js';

/**
 * What every blink app reads from context: the active {@link Theme} and the
 * resolved {@link IconSet}. Both are stable for the life of the app — themes
 * don't hot-swap and the icon set is decided once at boot.
 */
export interface BlinkContextValue {
  theme: Theme;
  iconSet: IconSet;
}

const BlinkContext = createContext<BlinkContextValue>({
  theme: defaultTheme,
  iconSet: 'unicode',
});

export interface ThemeProviderProps {
  /** Active theme. Defaults to Catppuccin Mocha. */
  theme?: Theme;
  /**
   * Resolved icon set. Pass the result of `detectIconSet()` (awaited at boot).
   * Defaults to `'unicode'` — the safe mode that renders everywhere.
   */
  iconSet?: IconSet;
  children: React.ReactNode;
}

/**
 * Wrap a blink app once, at the root, above `<App/>`:
 *
 * ```tsx
 * const iconSet = await detectIconSet();
 * render(
 *   <ThemeProvider iconSet={iconSet}>
 *     <App />
 *   </ThemeProvider>
 * );
 * ```
 */
export function ThemeProvider({
  theme = defaultTheme,
  iconSet = 'unicode',
  children,
}: ThemeProviderProps): React.ReactElement {
  const value = useMemo<BlinkContextValue>(() => ({ theme, iconSet }), [theme, iconSet]);
  return <BlinkContext.Provider value={value}>{children}</BlinkContext.Provider>;
}

/** Full context: `{ theme, iconSet }`. */
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

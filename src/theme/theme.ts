import type { Palette } from './palette.js';
import { catppuccinMocha } from './palette.js';
import type { SemanticTokens } from './tokens.js';
import { mochaTokens } from './tokens.js';

/**
 * A blink theme bundles a raw {@link Palette} with its {@link SemanticTokens}
 * mapping. blink ships one theme today — `mocha` (Catppuccin Mocha) — but the
 * indirection means a `latte` (light) theme is a drop-in: define new tokens,
 * components are untouched.
 */
export interface Theme {
  /** Stable identifier, e.g. `"catppuccin-mocha"`. */
  name: string;
  /** Raw palette (escape hatch for one-off hues). */
  palette: Palette;
  /** Role-mapped tokens — what components consume. */
  tokens: SemanticTokens;
}

/** Catppuccin Mocha — blink's default (and currently only) theme. */
export const mocha: Theme = {
  name: 'catppuccin-mocha',
  palette: catppuccinMocha,
  tokens: mochaTokens,
};

/** The theme used when no `<ThemeProvider>` is mounted. */
export const defaultTheme = mocha;

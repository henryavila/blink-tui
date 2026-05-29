/**
 * Catppuccin Mocha — the canonical blink palette.
 *
 * 26 raw colours, hex values from the public Catppuccin spec. Components never
 * reach for these directly; they consume {@link SemanticTokens} instead (see
 * `tokens.ts`). The raw palette is exported for the rare case an app needs a
 * specific hue (e.g. colouring a domain glyph).
 *
 * Surfaces run darkest → lightest; text runs dimmest → brightest.
 */
export const catppuccinMocha = {
  // Surfaces (darkest → lightest)
  crust: '#11111b',
  mantle: '#181825',
  base: '#1e1e2e', // canonical background
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',

  // Overlays (mid greys)
  overlay0: '#6c7086',
  overlay1: '#7f849c',
  overlay2: '#9399b2',

  // Text (dimmest → brightest)
  subtext0: '#a6adc8',
  subtext1: '#bac2de',
  text: '#cdd6f4', // default foreground

  // Accents
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
} as const;

/** A raw Catppuccin Mocha colour name. */
export type PaletteColor = keyof typeof catppuccinMocha;

/** The raw palette shape: every colour name mapped to a hex string. */
export type Palette = Record<PaletteColor, string>;

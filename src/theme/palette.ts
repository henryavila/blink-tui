/**
 * blink palettes — the raw colour layer (LAYER 1 of the theming contract).
 *
 * A palette is 26 raw colours. It is the **only** thing a theme changes; every
 * semantic token (`--fg`, `--accent`, `--state-ok`, `--domain-*`, …) maps a
 * *role* onto one of these slots, and that role→slot grammar is identical for
 * every theme (see `tokens.ts`). Components never reach for a palette colour;
 * they consume {@link SemanticTokens}.
 *
 * Hex values are a 1:1 port of the `[data-theme]` blocks in the design system's
 * `colors_and_type.css`. This is the one file allowed to carry raw hex (the
 * contract checker enforces that).
 *
 * Slots run darkest → lightest for surfaces / overlays / text, then the 14
 * accent hues. Adding a theme = add one palette here and one entry in
 * `theme.ts` — every component and screen inherits it for free.
 */

/** A raw palette colour name — the 26 Catppuccin-shaped slots. */
export type PaletteColor =
  | 'crust'
  | 'mantle'
  | 'base'
  | 'surface0'
  | 'surface1'
  | 'surface2'
  | 'overlay0'
  | 'overlay1'
  | 'overlay2'
  | 'subtext0'
  | 'subtext1'
  | 'text'
  | 'rosewater'
  | 'flamingo'
  | 'pink'
  | 'mauve'
  | 'red'
  | 'maroon'
  | 'peach'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'sky'
  | 'sapphire'
  | 'blue'
  | 'lavender';

/** The raw palette shape: every colour name mapped to a hex string. */
export type Palette = Record<PaletteColor, string>;

/** The slot order — darkest→lightest surfaces, then text tiers, then 14 hues. */
export const PALETTE_SLOTS: readonly PaletteColor[] = [
  'crust', 'mantle', 'base', 'surface0', 'surface1', 'surface2',
  'overlay0', 'overlay1', 'overlay2', 'subtext0', 'subtext1', 'text',
  'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach',
  'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender',
] as const;

/**
 * neutral — Catppuccin Mocha. blink's calm dark base palette. `contrast`
 * (neutral+) and `vivid` reuse this exact palette and differ only in how the
 * intent layer spends it (see `theme.ts`).
 */
export const neutral: Palette = {
  crust: '#11111b',
  mantle: '#181825',
  base: '#1e1e2e',
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',
  overlay0: '#6c7086',
  overlay1: '#7f849c',
  overlay2: '#9399b2',
  subtext0: '#a6adc8',
  subtext1: '#bac2de',
  text: '#cdd6f4',
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
};

/** nord — frost & polar night · cool, low-chroma. */
export const nord: Palette = {
  crust: '#242933',
  mantle: '#2b303b',
  base: '#2e3440',
  surface0: '#3b4252',
  surface1: '#434c5e',
  surface2: '#4c566a',
  overlay0: '#545e72',
  overlay1: '#616e88',
  overlay2: '#707e9b',
  subtext0: '#aeb6c6',
  subtext1: '#d8dee9',
  text: '#eceff4',
  rosewater: '#ecd3c8',
  flamingo: '#e3c0bb',
  pink: '#c895b5',
  mauve: '#b48ead',
  red: '#bf616a',
  maroon: '#cf7782',
  peach: '#d08770',
  yellow: '#ebcb8b',
  green: '#a3be8c',
  teal: '#8fbcbb',
  sky: '#88c0d0',
  sapphire: '#81a1c1',
  blue: '#5e81ac',
  lavender: '#88c0d0',
};

/** gruvbox — retro · warm & earthy. */
export const gruvbox: Palette = {
  crust: '#1d2021',
  mantle: '#232829',
  base: '#282828',
  surface0: '#3c3836',
  surface1: '#504945',
  surface2: '#665c54',
  overlay0: '#7c6f64',
  overlay1: '#928374',
  overlay2: '#a89984',
  subtext0: '#bdae93',
  subtext1: '#d5c4a1',
  text: '#ebdbb2',
  rosewater: '#f9f5d7',
  flamingo: '#f2e5bc',
  pink: '#d3869b',
  mauve: '#b16286',
  red: '#fb4934',
  maroon: '#cc241d',
  peach: '#fe8019',
  yellow: '#fabd2f',
  green: '#b8bb26',
  teal: '#689d6a',
  sky: '#8ec07c',
  sapphire: '#458588',
  blue: '#83a598',
  lavender: '#d3869b',
};

/**
 * tokyonight — saturated indigo night, deepened: a darker canvas so the bright
 * indigo text & accents pop harder. blink's default theme.
 */
export const tokyonight: Palette = {
  crust: '#0b0c12',
  mantle: '#101119',
  base: '#15161f',
  surface0: '#1d1f2e',
  surface1: '#262b3d',
  surface2: '#383d57',
  overlay0: '#565f89',
  overlay1: '#737aa2',
  overlay2: '#828bb8',
  subtext0: '#9099bd',
  subtext1: '#a9b1d6',
  text: '#c0caf5',
  rosewater: '#f7c8d4',
  flamingo: '#ff9e9e',
  pink: '#ff75a0',
  mauve: '#bb9af7',
  red: '#f7768e',
  maroon: '#db4b4b',
  peach: '#ff9e64',
  yellow: '#e0af68',
  green: '#9ece6a',
  teal: '#73daca',
  sky: '#7dcfff',
  sapphire: '#2ac3de',
  blue: '#7aa2f7',
  lavender: '#bb9af7',
};

/** latte — Catppuccin Latte · the light theme (same roles, inverted luminance). */
export const latte: Palette = {
  crust: '#dce0e8',
  mantle: '#e6e9ef',
  base: '#eff1f5',
  surface0: '#ccd0da',
  surface1: '#bcc0cc',
  surface2: '#acb0be',
  overlay0: '#9ca0b0',
  overlay1: '#8c8fa1',
  overlay2: '#7c7f93',
  subtext0: '#6c6f85',
  subtext1: '#5c5f77',
  text: '#4c4f69',
  rosewater: '#dc8a78',
  flamingo: '#dd7878',
  pink: '#ea76cb',
  mauve: '#8839ef',
  red: '#d20f39',
  maroon: '#e64553',
  peach: '#fe640b',
  yellow: '#df8e1d',
  green: '#40a02b',
  teal: '#179299',
  sky: '#04a5e5',
  sapphire: '#209fb5',
  blue: '#1e66f5',
  lavender: '#7287fd',
};

/** Every named base palette, keyed by id — used by the theme registry. */
export const palettes = { neutral, nord, gruvbox, tokyonight, latte } as const;

/**
 * Catppuccin Mocha — kept as a named export for back-compat. Identical to
 * {@link neutral}; it is the escape hatch for the rare one-off hue.
 */
export const catppuccinMocha: Palette = neutral;

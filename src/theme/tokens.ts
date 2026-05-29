import { catppuccinMocha as c } from './palette.js';

/**
 * Semantic tokens — the layer components actually consume.
 *
 * A 1:1 port of the `--*` custom properties in the blink design system's
 * `colors_and_type.css`. Mapping roles (not raw hues) to colours is what lets
 * a future light theme drop in without touching a single component.
 *
 * In a terminal there is no CSS background; `bg*` tokens are applied via Ink's
 * `backgroundColor` prop (used sparingly — selection fills, inverse hotkeys)
 * and `fg*` tokens via `color`.
 */
export interface SemanticTokens {
  // Backgrounds
  bg: string; // app background
  bgElevated: string; // panels above bg (max one per screen)
  bgSunken: string; // status bars, gutters
  bgPanel: string; // default pane interior
  bgSelected: string; // row selection fill
  bgFocused: string; // focused row fill
  bgInverse: string; // inverse video for active hotkeys / headings

  // Foregrounds (three text tiers, then accents — never a fourth grey)
  fg: string; // default text
  fgMuted: string; // secondary text
  fgDim: string; // tertiary, hints
  fgFaint: string; // labels, captions
  fgDisabled: string; // disabled items, separators
  fgInverse: string; // text on bgInverse

  // Borders (rendered as glyphs — these colour the glyphs themselves)
  border: string; // default pane border
  borderFocus: string; // border of the focused pane
  borderStrong: string; // emphasised dividers

  // Accents (roles, not raw colours)
  accent: string; // primary, focus, brand
  accentAlt: string; // secondary brand
  link: string; // links / refs
  highlight: string; // search match, hotkey

  // States — semantic colour for status glyphs (✓ ✗ ◯ ◐ ⚠ ↻)
  stateOk: string;
  stateErr: string;
  stateWarn: string;
  statePending: string;
  stateDrift: string;
  stateInfo: string;
}

/** Catppuccin Mocha semantic token mapping. */
export const mochaTokens: SemanticTokens = {
  bg: c.base,
  bgElevated: c.mantle,
  bgSunken: c.crust,
  bgPanel: c.base,
  bgSelected: c.surface0,
  bgFocused: c.surface1,
  bgInverse: c.text,

  fg: c.text,
  fgMuted: c.subtext1,
  fgDim: c.subtext0,
  fgFaint: c.overlay1,
  fgDisabled: c.overlay0,
  fgInverse: c.base,

  border: c.surface1,
  borderFocus: c.lavender,
  borderStrong: c.overlay0,

  accent: c.lavender,
  accentAlt: c.mauve,
  link: c.blue,
  highlight: c.yellow,

  stateOk: c.green,
  stateErr: c.red,
  stateWarn: c.yellow,
  statePending: c.overlay1,
  stateDrift: c.peach,
  stateInfo: c.sky,
};

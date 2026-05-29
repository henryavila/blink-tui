import type { Palette } from './palette.js';
import { neutral } from './palette.js';

/**
 * Semantic tokens — the layer components actually consume (LAYER 2 of the
 * theming contract).
 *
 * A 1:1 port of the intent `--*` custom properties in the design system's
 * `colors_and_type.css`. Each token maps a *role* ("focus", "an error", "a
 * postgres row") onto a palette slot. This grammar is **identical for every
 * theme** — only the palette underneath it changes — which is what lets a
 * component recolour for free when the surface theme flips. A component never
 * sees a palette name and has no colour prop.
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
  fgInverse: string; // text on bgInverse / on an accent fill (always the palette base)

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

  // Domain families — brand/domain glyphs paint through a HUE FAMILY, never a
  // raw colour, so e.g. postgres stays "blue family" and recolours harmonically
  // with the active theme. A glyph entry's `color` is one of these token keys.
  domainBlue: string;
  domainAzure: string;
  domainCyan: string;
  domainGreen: string;
  domainRed: string;
  domainAmber: string;
  domainYellow: string;
  domainViolet: string;
  domainNeutral: string;
}

/**
 * Build the default intent mapping for a palette. This is LAYER 2 of the
 * contract — the role→slot grammar that never moves between themes. A theme is
 * just `buildTokens(itsPalette)`, optionally with a few intent overrides layered
 * on top (see `theme.ts`).
 */
export function buildTokens(p: Palette): SemanticTokens {
  return {
    bg: p.base,
    bgElevated: p.mantle,
    bgSunken: p.crust,
    bgPanel: p.base,
    bgSelected: p.surface0,
    bgFocused: p.surface1,
    bgInverse: p.text,

    fg: p.text,
    fgMuted: p.subtext1,
    fgDim: p.subtext0,
    fgFaint: p.overlay1,
    fgDisabled: p.overlay0,
    fgInverse: p.base,

    border: p.surface1,
    borderFocus: p.lavender,
    borderStrong: p.overlay0,

    accent: p.lavender,
    accentAlt: p.mauve,
    link: p.blue,
    highlight: p.yellow,

    stateOk: p.green,
    stateErr: p.red,
    stateWarn: p.yellow,
    statePending: p.overlay1,
    stateDrift: p.peach,
    stateInfo: p.sky,

    domainBlue: p.blue,
    domainAzure: p.sapphire,
    domainCyan: p.sky,
    domainGreen: p.green,
    domainRed: p.red,
    domainAmber: p.peach,
    domainYellow: p.yellow,
    domainViolet: p.mauve,
    domainNeutral: p.subtext1, // == --fg-muted
  };
}

/** Catppuccin Mocha (neutral) semantic tokens — kept as a named export. */
export const mochaTokens: SemanticTokens = buildTokens(neutral);

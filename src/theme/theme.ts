import type { Palette } from './palette.js';
import { neutral, nord, gruvbox, tokyonight, latte } from './palette.js';
import type { SemanticTokens } from './tokens.js';
import { buildTokens } from './tokens.js';
import { mixOklch } from './colorMix.js';

/** Dark or light surface — drives a theme picker's grouping, nothing else. */
export type ThemeMode = 'dark' | 'light';

/**
 * A blink theme bundles a raw {@link Palette} with its {@link SemanticTokens}
 * mapping plus picker metadata. The colour scheme is a property of the terminal
 * *surface*, exactly like a real terminal emulator: a component emits a semantic
 * role and the surface decides the pixels. Switching themes re-renders every
 * component from the new tokens — a component cannot diverge because it owns no
 * colour. The surface is owned in exactly one place (the `ThemeProvider`).
 */
export interface Theme {
  /** Stable id, e.g. `"tokyonight"`. */
  id: string;
  /** Human label for a picker, e.g. `"tokyo night"`. */
  label: string;
  /** Dark or light. */
  mode: ThemeMode;
  /** One-line description for a picker. */
  blurb: string;
  /** Raw palette (escape hatch for one-off hues). */
  palette: Palette;
  /** Role-mapped tokens — what components consume. */
  tokens: SemanticTokens;
  /** @deprecated alias of {@link id}, kept for back-compat. */
  name: string;
}

/** Just the picker-facing fields of a {@link Theme}. */
export type ThemeMeta = Pick<Theme, 'id' | 'label' | 'mode' | 'blurb'>;

/** Assemble a theme from a palette + metadata + optional intent overrides. */
function makeTheme(
  id: string,
  label: string,
  mode: ThemeMode,
  blurb: string,
  palette: Palette,
  intentOverrides: Partial<SemanticTokens> = {},
): Theme {
  return {
    id,
    name: id,
    label,
    mode,
    blurb,
    palette,
    tokens: { ...buildTokens(palette), ...intentOverrides },
  };
}

// ── built-in themes ───────────────────────────────────────────────────────────
// `neutral`, `nord`, `gruvbox`, `tokyonight`, `latte` are plain palette swaps.
// `contrast` and `vivid` reuse neutral's palette and only respend the intent
// layer — still one switch on the surface, still read by no component.

/** neutral — Catppuccin Mocha · the calm dark default palette. */
export const mocha: Theme = makeTheme(
  'neutral',
  'neutral',
  'dark',
  'Catppuccin Mocha · calm default',
  neutral,
);

/** neutral+ — same greys, more contrast. No colour added. */
const contrast: Theme = makeTheme(
  'contrast',
  'neutral+',
  'dark',
  'neutral · more contrast',
  neutral,
  {
    bg: neutral.crust, // deeper canvas → text & glyphs pop
    bgPanel: neutral.crust,
    bgElevated: neutral.base,
    bgSunken: neutral.mantle, // status bars lift off the canvas
    bgSelected: neutral.surface1, // brighter selection fill
    bgFocused: neutral.surface2, // brightest focus fill
    border: neutral.overlay1, // clearly visible borders
    borderStrong: neutral.overlay2,
    fgFaint: neutral.overlay2, // brighter labels / captions
    fgDim: neutral.subtext1, // lift the dimmest text tier
  },
);

/**
 * vivid — accent marks what's featured. The selected row and the focused pane's
 * border carry the accent; everything else stays exactly like neutral. The
 * selection fills are the accent mixed *into crust* (so they stay dark, never a
 * pale wash, and light row text stays readable).
 */
const vivid: Theme = makeTheme(
  'vivid',
  'vivid',
  'dark',
  'accent on selection & featured',
  neutral,
  {
    bgSelected: mixOklch(neutral.lavender, neutral.crust, 0.2),
    bgFocused: mixOklch(neutral.lavender, neutral.crust, 0.38),
    statePending: neutral.sky, // the last grey state goes chromatic
  },
);

/** nord — frost & polar night. */
export const nordTheme: Theme = makeTheme('nord', 'nord', 'dark', 'frost & polar night · cool', nord);
/** gruvbox — retro, warm & earthy. */
export const gruvboxTheme: Theme = makeTheme('gruvbox', 'gruvbox', 'dark', 'retro · warm & earthy', gruvbox);
/** tokyonight — saturated indigo night (blink's default). */
export const tokyonightTheme: Theme = makeTheme('tokyonight', 'tokyo night', 'dark', 'saturated indigo night', tokyonight);
/** latte — Catppuccin Latte, the light theme. */
export const latteTheme: Theme = makeTheme('latte', 'latte', 'light', 'Catppuccin Latte · light', latte);

// ── the registry ────────────────────────────────────────────────────────────
// Ordered the way a picker should list them (matches the design system).
const _registry = new Map<string, Theme>();
const _order: string[] = [];

function put(theme: Theme): void {
  if (!_registry.has(theme.id)) _order.push(theme.id);
  _registry.set(theme.id, theme);
}

[mocha, contrast, vivid, nordTheme, gruvboxTheme, tokyonightTheme, latteTheme].forEach(put);

/** blink's default theme — `tokyonight`. Used when no theme is selected. */
export const defaultTheme: Theme = tokyonightTheme;

/** Resolve a theme by id (falls back to {@link defaultTheme} for an unknown id). */
export function getTheme(id: string): Theme {
  return _registry.get(id) ?? defaultTheme;
}

/** True if a theme id is registered. */
export function hasTheme(id: string): boolean {
  return _registry.has(id);
}

/** Every registered theme, in picker order. */
export function allThemes(): Theme[] {
  return _order.map((id) => _registry.get(id)!);
}

/** Picker-facing metadata for every theme, in order. */
export function listThemes(): ThemeMeta[] {
  return allThemes().map(({ id, label, mode, blurb }) => ({ id, label, mode, blurb }));
}

/** A runtime theme definition — mirrors the design system's `registerTheme()`. */
export interface ThemeDefinition {
  /** Stable id (required). */
  id: string;
  /** Picker label. Defaults to `id`. */
  label?: string;
  /** Dark or light. Defaults to `'dark'`. */
  mode?: ThemeMode;
  /** One-line picker description. */
  blurb?: string;
  /** Base theme id to inherit the palette from. Defaults to `'neutral'`. */
  extends?: string;
  /** Palette slots to override — only list what you change; the rest inherit. */
  palette?: Partial<Palette>;
  /** Intent-token overrides (the "vivid"/"neutral+" trick). */
  intent?: Partial<SemanticTokens>;
}

/**
 * Register (or replace) a theme at runtime, from an app's own code — no
 * framework edits, mirroring `registerGlyphs`. Only list the slots you want to
 * change; everything else inherits from `extends` (default `neutral`), so a
 * handful of accent overrides is already a complete theme:
 *
 * ```ts
 * registerTheme({
 *   id: 'dracula', label: 'dracula', blurb: 'classic purple dark',
 *   extends: 'neutral',
 *   // hex strings for just the slots you change — the rest inherit from `extends`
 *   palette: { base, surface1, text, lavender, red, green },
 * });
 * // then drive it through the ThemeProvider / useThemeControls().setTheme('dracula')
 * ```
 *
 * Returns the assembled {@link Theme}. Unlike the web engine there is no global
 * "current theme" to `select` — the active theme is owned by the surface (the
 * `ThemeProvider`); switch with `useThemeControls().setTheme(id)`.
 */
export function registerTheme(def: ThemeDefinition): Theme {
  const base = getTheme(def.extends ?? 'neutral');
  const palette: Palette = { ...base.palette, ...def.palette };
  const theme = makeTheme(
    def.id,
    def.label ?? def.id,
    def.mode ?? 'dark',
    def.blurb ?? '',
    palette,
    def.intent ?? {},
  );
  put(theme);
  return theme;
}

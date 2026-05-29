import type { GlyphVariants, IconSet } from './types.js';
import type { SemanticTokens } from '../theme/tokens.js';
import { catppuccinMocha as c } from '../theme/palette.js';

/**
 * The canonical blink glyph palette — a 1:1 port of `assets/glyphs.json` from
 * the design system, widened to dual-mode `{ nerd, unicode, ascii }`.
 *
 * CONTRACT vs CONTENT. State + nav + box + spinner glyphs are the framework
 * **contract**: they appear in every blink app and never change, so they are
 * the only glyphs seeded into the registry at import.
 *
 * Domain glyphs (`mysql`, `docker`, `laravel`, …) are **content**, not
 * contract — they only make sense for the app that uses them. blink ships
 * **none** of them in core. An app registers its own at boot via
 * {@link registerGlyphs} and reads them back through {@link glyph}, resolved by
 * the SAME icon-set detection + `{ nerd → unicode → ascii }` fallback as core
 * glyphs. {@link COMMON_DOMAINS} is an OPTIONAL convenience pack an app may opt
 * into; it is never auto-registered.
 */

/** Build a Nerd Font private-use char from its codepoint (deterministic source). */
const nf = (codepoint: number): string => String.fromCodePoint(codepoint);

/** State glyphs — always coloured with their semantic state token. */
export const stateGlyphs = {
  check: { nerd: '✓', unicode: '✓', ascii: '[x]' },
  cross: { nerd: '✗', unicode: '✗', ascii: '[!]' },
  circle: { nerd: '◯', unicode: '◯', ascii: '[ ]' },
  half: { nerd: '◐', unicode: '◐', ascii: '[~]' },
  checkboxOn: { nerd: '☑', unicode: '☑', ascii: '[*]' },
  checkboxOff: { nerd: '☐', unicode: '☐', ascii: '[ ]' },
  // selected + locked (a required item — no toggle).
  checkboxLock: { nerd: '▣', unicode: '▣', ascii: '[#]' },
  warn: { nerd: '⚠', unicode: '⚠', ascii: '[!]' },
  rerun: { nerd: '↻', unicode: '↻', ascii: '(*)' },
} satisfies Record<string, GlyphVariants>;

/** Navigation glyphs — focus carets, expand chevrons, relation arrows. */
export const navGlyphs = {
  // ⚠ LOCKED — DO NOT SWAP THIS GLYPH (flagged in a prior audit).
  // The focus caret MUST stay WIDTH-1. `►` (U+25BA, solid right pointer) is the
  // one-cell sibling of the design's `▶` (U+25B6). `string-width` measures `▶`
  // as TWO cells, so changing `►` back to `▶` — or to any wide glyph — is a
  // rendering BUG, not a style choice: the focused row's highlight band gets a
  // hole behind the wide glyph's phantom cell and the List columns drift (see
  // the band logic in components/List.tsx). `►` looks identical (a filled
  // triangle) at one cell. Keep it as-is.
  focus: { nerd: '►', unicode: '►', ascii: '>' },
  collapsed: { nerd: '▸', unicode: '▸', ascii: '>' },
  expanded: { nerd: '▾', unicode: '▾', ascii: 'v' },
  depends: { nerd: '↳', unicode: '↳', ascii: '\\>' },
  flow: { nerd: '→', unicode: '→', ascii: '->' },
  back: { nerd: '◀', unicode: '◀', ascii: '<' },
  // Overflow markers for a windowed List / LogView — "there is more, off-screen".
  // Distinct from `collapsed`/`expanded` (chevrons): these mean "more rows here".
  moreAbove: { nerd: '▴', unicode: '▴', ascii: '^' },
  moreBelow: { nerd: '▾', unicode: '▾', ascii: 'v' },
} satisfies Record<string, GlyphVariants>;

/** Built-in glyph names — the contract set, before any app registrations. */
export type BuiltinGlyphName = keyof typeof stateGlyphs | keyof typeof navGlyphs;

// Mutable registry — seeded with the CONTRACT glyphs only. Domain glyphs are
// app content and join via registerGlyphs() (see COMMON_DOMAINS for the pack).
const registry = new Map<string, GlyphVariants>();
for (const table of [stateGlyphs, navGlyphs]) {
  for (const [name, variants] of Object.entries(table)) registry.set(name, variants);
}

/**
 * Register app-domain glyphs (or override built-ins). Call once at startup,
 * before the first render. Each entry may carry a `color` — owned here, at
 * REGISTRATION, never per render site, so a row says "this is a postgres row",
 * not "paint this blue":
 *
 * ```ts
 * registerGlyphs({ laravel: { nerd: nf(0xe73f), unicode: '◆', ascii: '[la]', color: ctp.red } });
 * registerGlyphs(COMMON_DOMAINS); // or take the convenience pack wholesale
 * ```
 */
export function registerGlyphs(extra: Record<string, GlyphVariants>): void {
  for (const [name, variants] of Object.entries(extra)) registry.set(name, variants);
}

/** True if a glyph name is registered. */
export function hasGlyph(name: string): boolean {
  return registry.has(name);
}

/**
 * Resolve a glyph name to a string for the given icon set. Unknown names return
 * the name itself (so a typo renders visibly rather than blank). Prefer the
 * {@link useGlyph} hook inside components — it reads the icon set from context.
 */
export function glyph(name: string, set: IconSet): string {
  const variants = registry.get(name);
  if (!variants) return name;
  return variants[set];
}

/**
 * The colour a registered domain glyph renders in, owned at registration. Read
 * by {@link List}/{@link DescriptionList} so the consumer never paints a domain
 * row by hand. Returns `undefined` for an unregistered name or one with no
 * colour — callers fall back to a muted token.
 */
export function glyphColor(name: string): string | undefined {
  return registry.get(name)?.color;
}

// ─── intent → (glyph, colour) ────────────────────────────────────────────────
// The framework owns the mapping from a semantic STATE name to its glyph + the
// token that colours it. Components take an intent name (`state="installed"`);
// they never accept a raw glyph or a raw colour from the consumer.

/** A resolved intent: a glyph NAME (resolve via {@link glyph}) + a colour token key. */
export interface StateIntent {
  /** Registry glyph name — resolve with `useGlyph()` / `glyph(name, set)`. */
  glyph: string;
  /** Semantic token key for the colour — read `tokens[token]`. */
  token: keyof SemanticTokens;
}

/** Row / detail status intents → glyph + colour. The house mapping, central. */
export const stateIntents = {
  installed: { glyph: 'check', token: 'stateOk' },
  ok: { glyph: 'check', token: 'stateOk' },
  done: { glyph: 'check', token: 'stateOk' },
  missing: { glyph: 'cross', token: 'stateErr' },
  error: { glyph: 'cross', token: 'stateErr' },
  err: { glyph: 'cross', token: 'stateErr' },
  failed: { glyph: 'cross', token: 'stateErr' },
  drift: { glyph: 'half', token: 'stateDrift' },
  partial: { glyph: 'half', token: 'stateDrift' },
  warn: { glyph: 'warn', token: 'stateWarn' },
  idempotent: { glyph: 'rerun', token: 'stateInfo' },
  pending: { glyph: 'circle', token: 'statePending' },
  info: { glyph: 'depends', token: 'stateInfo' },
} satisfies Record<string, StateIntent>;

/** A semantic state name the framework knows how to draw. */
export type StateName = keyof typeof stateIntents;

/** Resolve a state intent name to its glyph + colour token, or `null` if unknown. */
export function stateGlyph(name: string): StateIntent | null {
  return (stateIntents as Record<string, StateIntent>)[name] ?? null;
}

/** Selection intents → checkbox glyph + colour. `locked` is selected + non-toggle. */
export const selectionIntents = {
  selected: { glyph: 'checkboxOn', token: 'accent' },
  unselected: { glyph: 'checkboxOff', token: 'fgDim' },
  locked: { glyph: 'checkboxLock', token: 'fgMuted' },
} satisfies Record<string, StateIntent>;

/** A selection intent name. */
export type SelectionName = keyof typeof selectionIntents;

// ─── OPTIONAL convenience pack — NOT registered automatically ─────────────────
// The dev-tool domains most TUIs reuse. An app opts in with
// `registerGlyphs(COMMON_DOMAINS)` and is free to extend or override any entry.
// Each entry carries its own `color` (owned here, at registration — not per row).
// Nerd codepoints mirror `assets/glyphs.json`; unicode/ascii degrade to text so
// a fontless terminal shows `pg`, never tofu.
export const COMMON_DOMAINS = {
  database: { nerd: nf(0xf1c0), unicode: '▤', ascii: 'db', color: c.subtext1 },
  mysql: { nerd: nf(0xe704), unicode: '▤', ascii: 'my', color: c.sapphire },
  postgresql: { nerd: nf(0xe76e), unicode: '▤', ascii: 'pg', color: c.blue },
  redis: { nerd: nf(0xe76d), unicode: '◆', ascii: 'rd', color: c.red },
  docker: { nerd: nf(0xf308), unicode: '▦', ascii: 'dk', color: c.sky },
  github: { nerd: nf(0xf09b), unicode: '◉', ascii: 'gh', color: c.subtext1 },
  git: { nerd: nf(0xe702), unicode: '◈', ascii: 'gt', color: c.peach },
  ssh: { nerd: nf(0xf015), unicode: '⌂', ascii: 'sh', color: c.yellow },
  nodejs: { nerd: nf(0xe718), unicode: '❖', ascii: 'nd', color: c.green },
  php: { nerd: nf(0xe73d), unicode: '❮', ascii: 'ph', color: c.mauve },
  python: { nerd: nf(0xe73c), unicode: '❯', ascii: 'py', color: c.yellow },
  vim: { nerd: nf(0xe7c5), unicode: '✱', ascii: 'vi', color: c.green },
  apple: { nerd: nf(0xf179), unicode: '◇', ascii: 'mac', color: c.subtext1 },
  linux: { nerd: nf(0xf17c), unicode: '△', ascii: 'lx', color: c.yellow },
  ubuntu: { nerd: nf(0xf31b), unicode: '○', ascii: 'ub', color: c.peach },
  font: { nerd: nf(0xf031), unicode: 'ƒ', ascii: 'ft', color: c.subtext1 },
  ai: { nerd: nf(0xf2db), unicode: '▚', ascii: 'ai', color: c.lavender },
  bolt: { nerd: nf(0xf0e7), unicode: '↯', ascii: '!', color: c.peach },
} satisfies Record<string, GlyphVariants>;

/** A domain name from the optional {@link COMMON_DOMAINS} pack. */
export type CommonDomainName = keyof typeof COMMON_DOMAINS;

// ─── Box-drawing ───────────────────────────────────────────────────────────

/** A complete set of box-drawing characters for one border style. */
export interface BoxChars {
  tl: string;
  tr: string;
  bl: string;
  br: string;
  h: string;
  v: string;
}

/**
 * blink's border styles. The house style is **single-line, rounded** corners;
 * `single` (square) is a legacy opt-out. There is **no double-line border** — it
 * reads dated, and focus / modals are signalled by colour, not a heavier line.
 * `ascii` is the fontless fallback (`+ - |`).
 */
export const boxStyles = {
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  ascii: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
} satisfies Record<string, BoxChars>;

export type BoxStyleName = 'single' | 'rounded';

/**
 * Pick the right box characters for a style + icon set. In `ascii` mode every
 * style collapses to the ASCII set (`+ - |`); rounded corners aren't ASCII-safe.
 */
export function boxChars(style: BoxStyleName, set: IconSet): BoxChars {
  if (set === 'ascii') return boxStyles.ascii;
  return boxStyles[style];
}

// ─── Spinner & blocks ────────────────────────────────────────────────────────

/** Spinner frames per icon set. Braille for nerd/unicode, classic for ascii. */
export const spinnerFrames = {
  braille: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  ascii: ['|', '/', '-', '\\'],
} as const;

/** Frames for the given icon set. */
export function spinnerFor(set: IconSet): readonly string[] {
  return set === 'ascii' ? spinnerFrames.ascii : spinnerFrames.braille;
}

/** Block-shade ramp — the only "gradient" the contract allows. */
export const blocks = {
  full: '█',
  dark: '▓',
  medium: '▒',
  light: '░',
  cursor: '▎',
} as const;

/**
 * Horizontal eighth-block ramp — the sub-cell material for a determinate
 * {@link ProgressBar}. Indexed by eighths filled (`0` = empty, `8` = a full
 * cell `█`). Left-to-right partials, the same family as {@link blocks}, so the
 * bar stays inside the one sanctioned "gradient".
 *
 * The `ascii` icon set has no partials — a bar there fills in whole `#` cells
 * and drops the fractional eighth (see `ProgressBar`).
 */
export const blocksH = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'] as const;

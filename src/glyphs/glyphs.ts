import type { GlyphVariants, IconSet } from './types.js';

/**
 * The canonical blink glyph palette — a 1:1 port of `assets/glyphs.json` from
 * the design system, widened to dual-mode `{ nerd, unicode, ascii }`.
 *
 * State + nav glyphs are universal (the same char renders in any font), so
 * their `nerd` and `unicode` variants match; only `ascii` differs. Domain
 * glyphs live in the Nerd Font private-use area, so their `unicode`/`ascii`
 * variants degrade to a short text label rather than tofu.
 *
 * Do not add domain glyphs ad hoc — extend via {@link registerGlyphs} from the
 * consuming app so the package stays the source of truth for universal glyphs
 * and apps own their domain vocabulary.
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
  warn: { nerd: '⚠', unicode: '⚠', ascii: '[!]' },
  rerun: { nerd: '↻', unicode: '↻', ascii: '(*)' },
} satisfies Record<string, GlyphVariants>;

/** Navigation glyphs — focus carets, expand chevrons, relation arrows. */
export const navGlyphs = {
  focus: { nerd: '▸', unicode: '▸', ascii: '>' },
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

/**
 * Domain glyphs — Nerd Font private-use codepoints (built via {@link nf}) with
 * text fallbacks. Codepoints mirror `assets/glyphs.json` exactly.
 */
export const domainGlyphs = {
  database: { nerd: nf(0xf1c0), unicode: 'db', ascii: 'db' },
  mysql: { nerd: nf(0xe704), unicode: 'mysql', ascii: 'mysql' },
  postgresql: { nerd: nf(0xe76e), unicode: 'pg', ascii: 'pg' },
  redis: { nerd: nf(0xe76d), unicode: 'redis', ascii: 'redis' },
  docker: { nerd: nf(0xf308), unicode: 'docker', ascii: 'docker' },
  github: { nerd: nf(0xf09b), unicode: 'gh', ascii: 'gh' },
  git: { nerd: nf(0xe702), unicode: 'git', ascii: 'git' },
  ssh: { nerd: nf(0xf015), unicode: 'ssh', ascii: 'ssh' },
  nodejs: { nerd: nf(0xe718), unicode: 'node', ascii: 'node' },
  php: { nerd: nf(0xe73d), unicode: 'php', ascii: 'php' },
  python: { nerd: nf(0xe73c), unicode: 'py', ascii: 'py' },
  vim: { nerd: nf(0xe7c5), unicode: 'vim', ascii: 'vim' },
  apple: { nerd: nf(0xf179), unicode: 'mac', ascii: 'mac' },
  linux: { nerd: nf(0xf17c), unicode: 'linux', ascii: 'linux' },
  ubuntu: { nerd: nf(0xf31b), unicode: 'ubuntu', ascii: 'ubuntu' },
  font: { nerd: nf(0xf031), unicode: 'font', ascii: 'font' },
  ai: { nerd: nf(0xf2db), unicode: 'ai', ascii: 'ai' },
  bolt: { nerd: nf(0xf0e7), unicode: '↯', ascii: '!' },
} satisfies Record<string, GlyphVariants>;

/** Built-in glyph names (state + nav + domain), before any app registrations. */
export type BuiltinGlyphName =
  | keyof typeof stateGlyphs
  | keyof typeof navGlyphs
  | keyof typeof domainGlyphs;

// Mutable registry — seeded with the built-ins, extended via registerGlyphs().
const registry = new Map<string, GlyphVariants>();
for (const table of [stateGlyphs, navGlyphs, domainGlyphs]) {
  for (const [name, variants] of Object.entries(table)) registry.set(name, variants);
}

/**
 * Register app-domain glyphs (or override built-ins). Call once at startup,
 * before the first render:
 *
 * ```ts
 * registerGlyphs({ tailscale: { nerd: nf(0xf0e9), unicode: 'mesh', ascii: 'mesh' } });
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

/** blink's three border weights, plus an ASCII-safe set. */
export const boxStyles = {
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  ascii: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
} satisfies Record<string, BoxChars>;

export type BoxStyleName = 'single' | 'rounded' | 'double';

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

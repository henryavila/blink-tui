import type { GlyphColor, GlyphVariants, IconSet } from './types.js';
import type { SemanticTokens } from '../theme/tokens.js';
import { nfChar } from './nerdIndex.js';

/**
 * The blink glyph ENGINE — the Tier 0 contract (state · nav · box · spinner ·
 * blocks) plus the extensible registry that powers Tiers 1–3.
 *
 * ─ Fonts vs. registry ─ The *drawing* of every Nerd Font glyph already lives in
 * the user's terminal **font** (CaskaydiaMono ships ~10k icons in the Private
 * Use Area); printing a codepoint is enough. What blink owns is the **registry**:
 * the map from a semantic NAME to a glyph plus its curated `{ unicode, ascii }`
 * fallbacks and its semantic `color` (a {@link SemanticTokens} key). Those three
 * are curation — they can't be auto-derived for 10k icons — which is why blink
 * *degrades* a glyph (nerd → unicode → ascii) rather than rendering tofu.
 *
 * ─ Contract vs. content ─ Tier 0 (this file) is the contract: it appears in
 * every blink app and never changes, so it's the only thing seeded into the
 * registry at import. Domain glyphs (Tiers 1–3) are CONTENT: the app opts in via
 * {@link registerGlyphs} (`packs.ts`) or the raw index (`nerdIndex.ts`, `nf()`).
 * blink core ships **zero** domain glyphs registered.
 */

// ── Tier 0: the contract — state glyphs (coloured by their state intent) ──────
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
  moreAbove: { nerd: '▴', unicode: '▴', ascii: '^' },
  moreBelow: { nerd: '▾', unicode: '▾', ascii: 'v' },
} satisfies Record<string, GlyphVariants>;

/** Built-in glyph names — the contract set, before any app registrations. */
export type BuiltinGlyphName = keyof typeof stateGlyphs | keyof typeof navGlyphs;

// ── defaults for uncurated / easy-form glyphs ────────────────────────────────
/** A raw glyph with no curated colour renders muted — neutral, never semantic. */
export const DEFAULT_GLYPH_COLOR: GlyphColor = 'fgMuted';
/** A registered glyph with no curated unicode fallback degrades to this mark. */
export const DEFAULT_UNICODE = '◆';

// ── the registry — seeded with the CONTRACT glyphs only ───────────────────────
const registry = new Map<string, GlyphVariants>();
for (const table of [stateGlyphs, navGlyphs]) {
  for (const [name, variants] of Object.entries(table)) registry.set(name, variants);
}

/** `deriveAscii('postgresql')` → `'[po]'` — used when an entry omits an ascii fallback. */
export function deriveAscii(name: string): string {
  const s = String(name || '')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 2)
    .toLowerCase();
  return '[' + (s || '?') + ']';
}

/**
 * What {@link registerGlyphs} accepts per entry — three shapes, all coexisting:
 *   - verbose : `{ nerd:'', unicode:'◆', ascii:'[la]', color:'domainRed' }`
 *   - easy    : `{ nf:'dev-laravel', color:'domainRed' }`  ← codepoint from the index
 *   - raw cp  : `{ cp:'e73f', color:'domainRed' }`         ← codepoint from hex
 *   - string  : `''`                                  ← nerd only, all defaults
 * Anything omitted is filled in: `unicode → ◆`, `ascii → derived`, `color → muted`.
 */
export type GlyphInput =
  | string
  | (Partial<GlyphVariants> & { nf?: string; cp?: string });

function normalizeEntry(name: string, e: GlyphInput): GlyphVariants {
  const input: Partial<GlyphVariants> & { nf?: string; cp?: string } =
    typeof e === 'string' ? { nerd: e } : e;
  let nerd = input.nerd;
  if (nerd == null && input.cp != null) {
    try {
      nerd = String.fromCodePoint(parseInt(input.cp, 16));
    } catch {
      /* leave nerd undefined */
    }
  }
  if (nerd == null && input.nf != null) nerd = nfChar(input.nf);
  return {
    nerd: nerd ?? '',
    unicode: input.unicode ?? DEFAULT_UNICODE,
    ascii: input.ascii ?? deriveAscii(name),
    color: input.color ?? DEFAULT_GLYPH_COLOR,
  };
}

/**
 * Register app-domain glyphs (or override built-ins). Call once at startup,
 * before the first render. Accepts one or more maps — later wins — so an app can
 * take a pack then override the few entries it cares about. Each entry's `color`
 * is owned here, at REGISTRATION, never per render site, so a row says "this is a
 * postgres row", not "paint this blue":
 *
 * ```ts
 * registerGlyphs(COMMON_DOMAINS);                       // Tier 1 pack
 * registerGlyphs(LANGUAGES, DATABASES);                 // many Tier 2 packs
 * registerGlyphs({ deploy: { nf: 'fa-rocket' } });      // easy form, from the index
 * registerGlyphs({ database: { color: 'domainCyan' } }); // override one
 * ```
 */
export function registerGlyphs(...maps: Array<Record<string, GlyphInput> | undefined>): void {
  for (const map of maps) {
    if (!map) continue;
    for (const [name, entry] of Object.entries(map)) registry.set(name, normalizeEntry(name, entry));
  }
}

/** Single-entry convenience for {@link registerGlyphs}. */
export function registerGlyph(name: string, entry: GlyphInput): void {
  registerGlyphs({ [name]: entry });
}

/** True if a glyph name is registered. */
export function hasGlyph(name: string): boolean {
  return registry.has(name);
}

/** Every registered glyph name, sorted — for pickers & tests. */
export function registeredNames(): string[] {
  return [...registry.keys()].sort();
}

/**
 * Resolve a glyph name to a string for the given icon set, with the
 * `nerd → unicode → ascii` fallback. Unknown names return the name itself (so a
 * typo or an unregistered domain renders visibly as text rather than tofu).
 * Prefer the {@link useGlyph} hook inside components — it reads the icon set from
 * context.
 */
export function glyph(name: string, set: IconSet): string {
  const v = registry.get(name);
  if (!v) return name;
  if (set === 'ascii') return v.ascii || v.unicode || v.nerd || name;
  if (set === 'unicode') return v.unicode || v.ascii || v.nerd || name;
  return v.nerd || v.unicode || v.ascii || name;
}

/**
 * The colour a registered glyph renders in — a {@link SemanticTokens} key, owned
 * at registration. Resolve it through the active theme: `tokens[glyphColor(name)
 * ?? 'fgMuted']`. Returns `undefined` for an unregistered name or a contract
 * glyph (whose colour comes from the state-intent map, not the entry).
 */
export function glyphColor(name: string): GlyphColor | undefined {
  return registry.get(name)?.color;
}

// ── intent → (glyph, colour) ──────────────────────────────────────────────────
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

// ── Box-drawing ───────────────────────────────────────────────────────────────

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

// ── Spinner & blocks ────────────────────────────────────────────────────────

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
 * cell `█`). Left-to-right partials, the same family as {@link blocks}.
 */
export const blocksH = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'] as const;

// ── Tiers 1–3 re-exports — content the app opts into ─────────────────────────
export {
  COMMON_DOMAINS,
  LANGUAGES,
  DATABASES,
  CLOUD,
  EDITORS,
  OS,
  COMPANIES,
  FRAMEWORKS,
  FILES,
  SOCIAL,
  ACTIONS,
  PACKAGES,
  GLYPH_PACKS,
} from './packs.js';
export type { CommonDomainName } from './packs.js';
export { nf, nfHas, nfChar, registerNerdIndex, NERD_INDEX, NERD_INDEX_SOURCES } from './nerdIndex.js';

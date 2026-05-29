import type { SemanticTokens } from '../theme/tokens.js';

/**
 * The three rendering modes every blink glyph supports.
 *
 * - `nerd`    — full Nerd Font vocabulary, incl. private-use domain logos.
 * - `unicode` — safe Unicode glyphs (✓ ✗ ◯ …); domain glyphs degrade to text.
 * - `ascii`   — `[x] [!] [ ]` etc. for CI, `TERM=dumb`, and fontless terminals.
 *
 * An app never breaks: if the font is missing, the worst case is text-shaped
 * fallbacks, never tofu boxes (□). Resolved once at startup by
 * `detectIconSet()` and carried in the theme context.
 */
export type IconSet = 'nerd' | 'unicode' | 'ascii';

/**
 * A glyph's colour, expressed as **intent** — a semantic token key, never a raw
 * hue. A domain glyph paints through a hue family (`'domainBlue'`,
 * `'domainGreen'`, …) so it keeps its relative identity *and* recolours with the
 * active theme. State / nav contract glyphs leave this unset — their colour
 * comes from the state-intent map, not the glyph entry.
 */
export type GlyphColor = keyof SemanticTokens;

/** A single glyph's three rendering variants, plus an optional owned colour. */
export interface GlyphVariants {
  nerd: string;
  unicode: string;
  ascii: string;
  /**
   * The colour this glyph renders in, owned at registration (the "intent, not
   * style" rule for domain glyphs) and given as a {@link SemanticTokens} key.
   * Components resolve it through the active theme via `glyphColor(name)` and
   * fall back to a muted token when absent.
   */
  color?: GlyphColor;
}

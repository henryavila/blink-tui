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

/** A single glyph's three rendering variants. */
export interface GlyphVariants {
  nerd: string;
  unicode: string;
  ascii: string;
}

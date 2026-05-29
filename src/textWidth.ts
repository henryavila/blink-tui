import stringWidth from 'string-width';

/**
 * Terminal cell width of a string, used to pin {@link List} columns and to drop
 * {@link Footer} chips that don't fit — so the character grid stays aligned (the
 * contract's "strict character-cell grid").
 *
 * Delegates to the same `string-width` Ink uses for its own layout, so the
 * widths computed here always agree with how Ink sizes its boxes — including
 * the wide glyphs in the palette (`⚠`, `☑` measure two cells) and the
 * multi-char `ascii` fallbacks (`[x]` measures three). Hand-rolling this drifts
 * from Ink and makes fixed-width cells truncate or misalign.
 *
 * Caveat: a terminal configured with "ambiguous = wide" (common in CJK locales)
 * may render some glyphs wider than string-width reports; that's a terminal
 * setting no layout-time measurement can see.
 */
export function cellWidth(str: string): number {
  return stringWidth(str);
}

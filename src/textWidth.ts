/**
 * Best-effort terminal cell width of a string: most code points count as one
 * cell, East-Asian Wide / Fullwidth / emoji ranges as two; control and
 * combining characters count as zero.
 *
 * Used to pin {@link List} columns and to drop {@link Footer} chips that don't
 * fit, so the character grid stays aligned across icon sets — the contract's
 * "strict character-cell grid".
 *
 * Caveat: ambiguous-width glyphs (e.g. `◯ ◐ ✓ ✗`) count as one here, matching
 * the `string-width` Ink uses for its own layout. Terminals configured with
 * "ambiguous = wide" (common in CJK locales) render them double; keep universal
 * glyphs to unambiguous codepoints where alignment is critical.
 */
export function cellWidth(str: string): number {
  let width = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp === 0) continue;
    if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) continue; // C0/C1 control
    if (cp >= 0x0300 && cp <= 0x036f) continue; // combining marks
    width += isWide(cp) ? 2 : 1;
  }
  return width;
}

/** East-Asian Wide + Fullwidth + emoji code-point ranges (rendered two cells). */
function isWide(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) || // Hangul Jamo
    cp === 0x2329 ||
    cp === 0x232a ||
    (cp >= 0x2e80 && cp <= 0x303e) || // CJK radicals … Kangxi
    (cp >= 0x3041 && cp <= 0x33ff) || // Hiragana … CJK compat
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Ext A
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified
    (cp >= 0xa000 && cp <= 0xa4cf) || // Yi
    (cp >= 0xac00 && cp <= 0xd7a3) || // Hangul syllables
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK compat ideographs
    (cp >= 0xfe30 && cp <= 0xfe4f) || // CJK compat forms
    (cp >= 0xff00 && cp <= 0xff60) || // Fullwidth forms
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1faff) || // emoji / symbols
    (cp >= 0x20000 && cp <= 0x3fffd) // CJK Ext B+
  );
}

/**
 * A faithful port of CSS `color-mix(in oklch, …)` for the few themes that blend
 * a palette accent into a surface (the `vivid` theme mixes lavender into crust
 * for its selection fills). Terminals render truecolour hex, so we resolve the
 * mix to a single hex at theme-build time — the result matches what a browser
 * shows for the same `color-mix(in oklch, …)` declaration in the design system.
 *
 * Mixing happens in OKLab (the rectangular form of OKLCh; for a two-colour mix
 * the interpolated result is identical whether you walk Lab or LCh, since both
 * endpoints share the path). sRGB → linear → OKLab → mix → linear → sRGB.
 */

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function rgbToHex([r, g, b]: RGB): string {
  const to = (v: number): string => {
    const n = Math.max(0, Math.min(255, Math.round(v * 255)));
    return n.toString(16).padStart(2, '0');
  };
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** sRGB component → linear-light. */
function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
/** linear-light component → sRGB. */
function toSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** linear-sRGB → OKLab (Björn Ottosson's matrices). */
function linearToOklab([r, g, b]: RGB): RGB {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

/** OKLab → linear-sRGB. */
function oklabToLinear([L, a, b]: RGB): RGB {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/**
 * Mix two hex colours in OKLab — the equivalent of
 * `color-mix(in oklch, colorA weightA, colorB)`.
 *
 * @param colorA  first colour (hex `#rrggbb`)
 * @param colorB  second colour (hex `#rrggbb`)
 * @param weightA fraction of `colorA` in `0..1` (e.g. `0.2` → 20% A / 80% B)
 */
export function mixOklch(colorA: string, colorB: string, weightA: number): string {
  const wA = Math.max(0, Math.min(1, weightA));
  const wB = 1 - wA;
  const labA = linearToOklab(hexToRgb(colorA).map(toLinear) as RGB);
  const labB = linearToOklab(hexToRgb(colorB).map(toLinear) as RGB);
  const lab: RGB = [
    labA[0] * wA + labB[0] * wB,
    labA[1] * wA + labB[1] * wB,
    labA[2] * wA + labB[2] * wB,
  ];
  return rgbToHex(oklabToLinear(lab).map(toSrgb) as RGB);
}

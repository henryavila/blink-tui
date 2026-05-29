---
name: blink-design
description: Use this skill to generate well-branded interfaces and assets for Blink, a framework for building modern, elegant TUI (terminal user interface) apps — either for production or throwaway prototypes/mocks. Contains Blink's visual contract, Catppuccin Mocha colors, CaskaydiaMono Nerd Font, the canonical glyph palette, and a reusable TUI UI kit.
user-invocable: true
---

Read the `README.md` file within this skill, then explore the other available
files: `colors_and_type.css` (palette + type tokens), `assets/glyphs.json`
(the CORE glyph palette — states, arrows, box-drawing, blocks; domain glyphs
are app-registered, not in core), `assets/logo.txt` (the Blink wordmark +
lockups), and `ui_kits/tui_app/` (reusable Pane / List / Header / Banner /
DescriptionList / Footer / Input / Dialog components plus an interactive demo).

**Blink** is a framework for building modern, elegant TUI apps. This design
system is Blink's house style — the look every Blink app inherits — and a
**strict visual contract**. Read VISUAL FOUNDATIONS in the README before
designing anything. The short version:

- Monospace only (CaskaydiaMono Nerd Font), one size (14px), one weight (400).
- Dark background `#1e1e2e` (Catppuccin Mocha base). No gradients, images, or blur.
- Every border is a Unicode box-drawing glyph — **never** CSS border/radius/outline.
- Flexbox only. No grid, no absolute positioning, no z-index in app screens.
- Keyboard-only. Focus is `▶` / inverse video / border recolour — never a focus ring.
- No shadows, no transforms, no transitions. Only motion: cursor blink + spinner.
- No emoji, no SVG icons. Status is carried by core glyphs from `assets/glyphs.json`;
  domain glyphs are app-registered via `registerGlyphs()`, never baked into core.
  Glyphs come in four opt-in tiers — contract (core), the `COMMON_DOMAINS` pack,
  curated category packs (languages/databases/cloud/editors/os/companies), and a
  raw Nerd Font index (`nf()`) escape hatch. See README > ICONOGRAPHY and the
  `ui_kits/tui_app/glyph-*.js` files.
- **Intent, not style.** Components take semantic props (`tone="focus"`,
  `state="installed"`, `selected`, `domain="postgresql"`) — never a raw glyph,
  colour, or shape. The framework resolves the looks from house tokens.

Brand: the name is always lowercase **blink**. The mark is the blinking cursor
block — `bl▎nk` (block as the "i") or `blink█` (trailing block) — accented in
lavender. See `assets/logo.txt`.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy the
font and CSS out and produce static HTML files for the user to view. If working
on production code, copy assets and absorb the rules here to design as an expert
in this brand.

If the user invokes this skill without other guidance, ask them what they want
to build, ask a few focused questions, and act as an expert designer who outputs
HTML artifacts or production code as the need dictates.

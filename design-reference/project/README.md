# blink — Design System

**blink** is a framework for building **modern, elegant TUI apps**. This is
blink's house style — the look every blink app inherits — codified as a strict
visual contract: monospace, character-cell grid, Unicode borders, Catppuccin
Mocha palette, keyboard-only interaction.

The name is always lowercase **blink**. The mark is the blinking cursor block —
`bl▎nk` (block as the "i") or `blink█` (trailing block) — accented in lavender.
It makes the framework's one sanctioned animation, the cursor blink, the heart
of the brand. See `assets/logo.txt`.

> _If you can't draw it with characters, it doesn't belong in a blink app._

---

## Provided sources

- **Font:** `uploads/CaskaydiaMonoNerdFontMono-Regular.ttf` — CaskaydiaMono
  Nerd Font, copied to `fonts/`.
- **Palette:** Catppuccin Mocha (canonical hex values, public spec).
- **Visual contract:** strict constraints supplied directly in the brief
  (monospace, no shadows/blurs/transforms, Unicode box-drawing for borders,
  flexbox-only, keyboard-only).
- **Glyph palette:** an explicit set of Nerd Font / Unicode glyphs supplied in
  the brief — see `ICONOGRAPHY`.
- **Name:** `blink` was chosen from a set of explored directions (caret,
  lattice, rune, tess, lumen) — see `brand/Name & Mark Exploration.html`.

No codebase, Figma file, or sample slides were provided. The system is built
directly from the constraints. Because blink is a *framework*, the UI kit is a
reference app showing how blink's primitives compose; swap in a real product
when one exists.

---

## Index

```
.
├── README.md                  ← you are here
├── SKILL.md                   ← agent-skill entry point (Claude Code compatible)
├── colors_and_type.css        ← CSS vars: palette, semantic tokens, type
├── fonts/
│   └── CaskaydiaMonoNerdFontMono-Regular.ttf
├── assets/
│   ├── glyphs.json            ← canonical glyph palette (states, arrows, domain)
│   ├── logo.txt               ← blink wordmark + lockups (primary / alt / favicon)
│   └── favicon-{16,32,64,256}.png  ← cursor-block favicon, lavender on base
├── brand/
│   ├── Name & Mark Exploration.html  ← name + mark directions explored
│   ├── Boot Splash.html       ← animated app launch screen
│   └── Docs Landing.html      ← docs/marketing landing, terminal aesthetic
├── preview/                   ← Design System tab cards (registered assets)
│   ├── 01-logo.html
│   ├── 02-color-surfaces.html
│   ├── 03-color-text.html
│   ├── 04-color-accents.html
│   ├── 05-color-states.html
│   ├── 06-type-specimen.html
│   ├── 07-type-scale.html
│   ├── 08-glyphs-states.html
│   ├── 09-glyphs-arrows.html
│   ├── 10-glyphs-domain.html
│   ├── 11-borders.html
│   ├── 12-spacing-grid.html
│   ├── 13-component-pane.html
│   ├── 14-component-list.html
│   ├── 15-component-footer.html
│   ├── 16-component-input.html
│   ├── 17-component-dialog.html
│   └── 18-component-spinner.html
└── ui_kits/
    └── tui_app/
        ├── README.md
        ├── index.html         ← interactive 100×30 app demo
        ├── Pane.jsx
        ├── List.jsx
        ├── Footer.jsx
        ├── Input.jsx
        ├── Dialog.jsx
        └── glyphs.js
```

---

## CONTENT FUNDAMENTALS

blink copy is **terse, lowercase, and command-shaped**. It reads like output
from a well-engineered CLI, not like marketing copy. (This applies to the
framework's own surfaces — docs, CLI, errors — and is the default voice apps
built with blink inherit.)

### Voice

- **Second person, imperative.** "press `?` for help", not "you can press `?`
  for help".
- **Lowercase by default.** Sentence case only for proper nouns and product
  names. UPPER CASE is reserved for KEY indicators (`TAB`, `ENTER`, `?`).
- **No exclamation marks.** A TUI is calm. Errors say `✗ connection refused`,
  not `Connection failed!`.
- **State, then action.** `3 changes  ↳ press a to apply` — not "You have
  unsaved changes. Click here to apply them."
- **No first person.** Never "I'll do that for you". The program is a tool, not
  a colleague.

### Length

| Surface         | Limit                 | Example                                   |
|-----------------|-----------------------|-------------------------------------------|
| Pane title      | ≤ 18 chars            | ` services `                              |
| List row label  | ≤ 32 chars            | `postgres@14.10  ↳ data/pg`               |
| Status (footer) | one line @ 100 cols   | `▶ tab: switch  enter: open  q: quit`     |
| Dialog body     | ≤ 3 lines             | `delete branch?\nfeature/login\ny/N`      |
| Error           | ≤ 60 chars            | `✗ port 5432 in use — is postgres running?` |

### Punctuation & typography

- No emoji. Ever. Status is carried by **glyphs from the approved palette**
  (`✓ ✗ ◯ ◐ ⚠ ↻`) coloured with semantic tokens.
- Em-dash (`—`) for asides and short causal joins (`✗ failed — port in use`).
- Arrow `↳` for dependency / consequence. Arrow `→` for forward flow.
- Numbers right-aligned in columns; counts always have a noun
  (`3 changes`, not `3`).
- No trailing punctuation on labels or hotkey hints.

### Tone examples

| ✗ Off-brand                            | ✓ On-brand                          |
|---------------------------------------|-------------------------------------|
| "Welcome! Let's get you started."     | `▸ press ? for keys, q to quit`     |
| "Are you sure you want to delete?"    | `delete branch feature/login? y/N`  |
| "Successfully connected to database!" | `✓ connected  postgres@14.10`       |
| "Loading, please wait..."             | `↻ syncing  3/12`                   |
| "An unexpected error occurred."       | `✗ timeout after 5s`                |

---

## VISUAL FOUNDATIONS

The full visual contract. Everything a blink app renders flows from these rules.

### Colour

- **Palette:** Catppuccin Mocha, full 26-token set. See `colors_and_type.css`.
- **Background:** `--ctp-base` (`#1e1e2e`). Always. Never gradients, never
  images, never blur.
- **Three text tiers** for hierarchy: `--fg` (text), `--fg-muted`
  (subtext1), `--fg-dim` (subtext0). Beyond three tiers, use a colour from
  the accent set; never invent a fourth grey.
- **Accent = `--ctp-lavender`** (`#b4befe`). Focus rings (rendered as
  glyphs), brand wordmark, primary keybind highlights.
- **Semantic colour is *only* on glyphs and inverse-video bars** — never on
  body text. Green is `✓`, not the word "ok".

### Type

- **One family:** CaskaydiaMono Nerd Font, fallback `Cascadia Mono`, then
  system mono. No variable axes, no italics.
- **One size on screen:** `14px` (`--fs-base`). HTML mocks of docs may use the
  scale (`12 / 13 / 14 / 16 / 20 / 28`), but live TUI screens hold at 14.
- **One weight:** 400. "Bold" is **inverse video** (text on `--bg-inverse`),
  not 700.
- **Tracking 0, ligatures off.** `font-feature-settings: "liga" 0, "calt" 0;`
  in the global reset. Anything else breaks the character cell.

### The character cell

The system is a grid of fixed cells (`--cell-w` × `--cell-h`, ~8.4 × 18px).
Spacing tokens are integer multiples of `--cell-w`. There is no `4px` and
there is no `12px`. There is `1ch`, `2ch`, `3ch`.

### Borders & containers

- **Every "border" is drawn with Unicode box-drawing characters.**
  `┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼` for normal, `╭ ╰ ╮ ╯` for rounded-where-supported,
  `╔ ═ ╗ ║ ╚ ╝` for double-line emphasis.
- **CSS `border`, `border-radius`, `outline` are forbidden** on box chrome.
- **Pane titles** sit *inside* the top border:
  `┌─ services ──────────────┐`. No tab containers, no headers floating
  above panes.

### Backgrounds & textures

- **Solid colour fills only.** No gradients, no images, no noise, no grain,
  no patterns. The only "texture" the system has is the glyph density of
  the box characters themselves.
- **Full-bleed background** is `--ctp-base`. Panels are the same colour as
  the background — they're separated by *border glyphs*, not by tonal
  contrast. (Optional: panels can sit on `--bg-elevated` for emphasis, max
  one per screen.)

### Hover, press, focus

- **There is no hover.** Cursors don't exist in a TUI. CSS `:hover` rules
  are forbidden.
- **There is no press.** Keys fire on press; there's no visible button
  depress.
- **Focus is character-based.** Three permitted treatments:
  1. **`▶` arrow** prefix on the focused row (preferred for lists).
  2. **Inverse video** of the focused row (preferred for buttons / tabs).
  3. **Border recolour** to `--border-focus` (lavender) on the focused
     pane. Same glyphs, different colour.
- Never `outline:`, never `box-shadow`, never a focus ring.

### Animation

- **No transitions, no transforms, no easing.** `transition`, `animation`,
  `transform`, `filter`, `backdrop-filter` are forbidden.
- Two motion exceptions, both character-level:
  - **Cursor blink:** the text cursor (`▎` or `█`) blinks at 1 Hz with `step-end`
    timing. No fade.
  - **Spinner:** rotating glyph cycle `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏` at ~80ms per
    frame, or `| / — \` for ASCII fallback.
- Loading is **`↻ syncing  3/12`** (counter advances), not a progress bar
  unless it's drawn from `█ ░` glyphs.

### Shadows & elevation

- **No shadows.** Elevation is communicated by **border weight**: single line
  (`─`) for default panes, double line (`═`) for the focused pane or a modal
  dialog.
- **No blur, no transparency.** `opacity` and `filter: blur()` are
  forbidden. `rgba()` with alpha is forbidden.

### Corners

- Default panes use **square corners** (`┌ ┐ └ ┘`).
- Dialogs and detail panes may use **rounded corners** (`╭ ╮ ╰ ╯`) where the
  rendering font supports them (Cascadia Mono does).
- "Corner radius" as a CSS property is forbidden. The corner is a glyph.

### Cards

There are no "cards". The analogous primitive is a **pane**: a box-drawn
rectangle with an optional title in the top border and a list of rows inside.
Panes don't lift, don't round (except via glyph), and don't shadow.

### Layout rules

- **Flexbox only.** `display: flex` with `flex-direction: column | row`.
  CSS Grid, `position: absolute`, `z-index`, and `float` are forbidden in
  app screens. (HTML preview cards may use Grid — they're documentation,
  not product.)
- **100 cols × 30 rows is the design target.** Mobile-mosh fallback is
  60 cols × 20 rows; designs must remain readable at both.
- **The footer bar is always visible.** It pins to the bottom row of the
  viewport and lists the active hotkeys (`▶ tab: switch  enter: open  q: quit`).
- **Multi-pane = nested flexbox.** A two-pane layout is a row-flex parent
  with two pane children, each a column-flex with header / body / status.

### Transparency

- Forbidden. Every pixel is opaque. The only "see-through" effect in the
  system is the dark background showing between border glyphs — and that's
  the background itself, not transparency.

### Imagery

- **There is no imagery.** No photography, no illustration, no SVG inside
  the app. The logo is ASCII / box-drawing characters (see `assets/logo.txt`).
- If a product *must* render an image (e.g. a thumbnail preview tool), it's
  rendered as a downsampled ANSI block-character mosaic (`█ ▓ ▒ ░`),
  coloured from the Catppuccin palette only.

---

## ICONOGRAPHY

blink uses **glyphs, not icons**. Every glyph is a single character from
CaskaydiaMono Nerd Font, occupies one character cell, and is referenced by
its Unicode codepoint.

The full canonical palette lives in `assets/glyphs.json`. Three categories:

### State glyphs (always coloured semantically)

| Glyph | Name        | Token             | Meaning                |
|-------|-------------|-------------------|------------------------|
| `✓`   | check       | `--state-ok`      | installed / done       |
| `✗`   | cross       | `--state-err`     | missing / failed       |
| `◯`   | circle      | `--state-pending` | pending                |
| `◐`   | half        | `--state-drift`   | drift / partial        |
| `☑`   | checkbox-on | `--accent`        | selected               |
| `☐`   | checkbox-off| `--fg-dim`        | unselected             |
| `⚠`   | warn        | `--state-warn`    | warning                |
| `↻`   | rerun       | `--state-info`    | idempotent / refresh   |

ASCII fallbacks: `✓→[x]  ✗→[!]  ◯→[ ]  ◐→[~]  ⚠→[!]  ↻→[*]`.

### Navigation glyphs

| Glyph | Name      | Meaning                                  |
|-------|-----------|------------------------------------------|
| `▶`   | focus     | left of the focused row                  |
| `▸`   | collapsed | right of an expandable label (closed)    |
| `▾`   | expanded  | right of an expandable label (open)      |
| `↳`   | depends   | dependency / consequence                 |
| `→`   | flow      | next step                                |
| `◀`   | back      | previous / return                        |

### Domain glyphs (Nerd Font private-use area)

The brief calls out these domains. Each is a literal Nerd Font codepoint —
they render as recognisable glyphs in CaskaydiaMono and are intentionally
not described here in prose so the source-of-truth is the font itself.

- `database` (generic), `mysql`, `postgresql`, `redis`
- `docker`, `github`, `git`, `ssh`
- `nodejs`, `php`, `python`, `vim`
- `apple` (macOS), `linux`, `ubuntu`
- `font`, `ai` / `brain`, `bolt` (action)

Canonical codepoints are stored in `assets/glyphs.json` and are imported by
`ui_kits/tui_app/glyphs.js`. **Do not invent new domain glyphs** without
adding them to that file and discussing with the system owner first.

### What is forbidden

- **No SVG icons.** Not Lucide, not Heroicons, not Phosphor. A blink app never
  ships an `<svg>`.
- **No emoji.** Emoji break the character cell (most are double-wide),
  introduce colour outside the palette, and read as informal.
- **No PNG icons.** Raster art belongs to OS launchers, not the app surface.
- **No CSS-drawn icons** (no chevrons via `border`, no spinners via
  `border-radius`). Use the glyph.

---

## SKILL.md

`SKILL.md` at the root makes this design system loadable as an Agent Skill in
Claude Code. From inside this folder, an agent reads `SKILL.md`, then this
`README.md`, then everything else, and can generate well-branded blink mocks
or production code.


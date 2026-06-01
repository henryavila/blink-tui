# blink — UI kit · `tui_app`

A canonical blink app that exercises every component in the framework
system at the 100 × 30 cell design target. There's no real product attached
to this design system yet, so this kit doubles as a **reference
implementation**: a fictional services manager called `svcd` that lets you
browse, inspect, and act on local development services.

## Files

```
ui_kits/tui_app/
├── README.md              ← this file
├── index.html             ← interactive demo (100×30 cells)
├── theme.js               ← THE THEME OWNER: applies/persists data-theme on the surface; setTheme/onTheme API
├── glyphs.js              ← ENGINE: core STATE/NAV/BOX/SPINNER + registry (registerGlyphs/glyph/nf)
├── glyph-packs.js         ← curated packs · COMMON_DOMAINS (t1) + 12 category packs (t2)
├── glyph-index.js         ← raw Nerd Font name→codepoint index seed (t3, nf() escape hatch + lazy-load)
├── glyph-index.full.json  ← generated full index (demo artifact; lazy-loaded on a miss)
├── Pane.jsx               ← box-drawn pane with optional title
├── List.jsx               ← rows: checkbox + state + domain columns, windowed
├── Header.jsx             ← top status bar (mark + title + right slot)
├── Banner.jsx             ← one-line in-flow notice (info/success/warn)
├── DescriptionList.jsx    ← key/value block for detail panes
├── Footer.jsx             ← bottom hotkey bar (always visible; 1-cell margin above by default, marginTop={0} to pin flush)
├── Input.jsx              ← single-line text field with ▎ cursor
├── Dialog.jsx             ← modal: rounded lavender pane (lines or rich children)
├── Form.jsx               ← labelled fields + useFormNavigation (text/secret/toggle/select/multiselect)
├── ProgressList.jsx       ← job runner: ProgressBar (eighth-block) + per-line spinner/state list
├── Showcase.jsx           ← small specimen helpers (KV/GlyphBank/BlockBar/KeyChips/BorderSpecimen)
├── Inventory.jsx          ← every colour · token · glyph tier/category · component · motion
└── Component Showcase.html ← the GLOBAL INVENTORY page (renders Inventory.jsx)
```

## How the demo works

Open `index.html`. The app fills a 100 × 30 cell viewport scaled to fit
the window. Keyboard only:

| Key            | Action                                    |
|----------------|-------------------------------------------|
| `↑ ↓` / `j k`  | move row focus                            |
| `tab`          | switch focus between left/right pane      |
| `/`            | open the search field (focuses left pane) |
| `↵` / `enter`  | open / drill in                           |
| `a`            | apply (rerun) the focused service         |
| `d`            | delete dialog for the focused service     |
| `esc`          | close any dialog                          |
| `?`            | toggle help dialog                        |
| `q`            | quit (resets demo state)                  |

Hover and click are **not bound**. There's no scroll wheel.

## Coverage

This kit deliberately implements only the visual + interaction primitives
of the blink contract, with light state for the demo:

- Two panes side-by-side via nested flexbox (no grid, no absolute)
- Focused pane recoloured by border glyph alone (lavender)
- List rows with `▶` arrow focus + `surface1` fill
- State glyphs (`✓ ✗ ◯ ◐ ⚠ ↻`) on each row
- Domain glyphs registered by the app — the kit takes the Tier 1 pack
  (`registerGlyphs(COMMON_DOMAINS)`) and registers `grafana` via the easy `nf`
  form (a codepoint from the raw Tier 3 index); blink core ships none registered
- Modal dialog as a focused (lavender) rounded pane that overlays
- Footer bar with hotkey chips in inverse video
- Cursor blink at 1 Hz, step-end (no fade)
- Braille spinner at 80 ms / frame, only while syncing

What it does **not** do: actual service management, hover styles, smooth
transitions, drop shadows, gradients, or any CSS borders. By contract.

## Theming — a property of the terminal surface

Colour is themed exactly the way a real terminal does it: **the colour scheme
belongs to the terminal, not to any program.** A component emits a semantic role
("this is focus", "this is an error") and the surface decides the pixels. Three
layers make this work (full spec in the header of `colors_and_type.css`):

1. **Palette** (`--ctp-*`) — 26 raw colours. The *only* thing a theme changes.
   Each theme is one `[data-theme]` block in `colors_and_type.css`.
2. **Intent** (`--fg`, `--accent`, `--state-ok`, `--border-focus`, `--domain-*`)
   — role → palette slot. **Identical for every theme.** The grammar never moves.
3. **Consumer** (components) — read layer 2 only. No colour prop, no palette name.

### How consistency is guaranteed (it is structural, not discipline)

- The theme is **one attribute, `data-theme`, on the root surface** (`<html>` —
  the terminal window; the cell grid inherits it).
- It is set in **exactly one place**: `theme.js` (the app shell), at boot. No
  component sets it, reads it, or branches on it. **There is no theme prop.**
- Switching = changing that one attribute; CSS inheritance repaints the whole
  tree. A component *cannot* diverge from the theme because it owns no colour.

```js
BlinkTheme.setTheme('nord');   // the single switch a picker calls
BlinkTheme.getTheme();         // 'nord'
BlinkTheme.onTheme(fn);        // re-render hook for live specimens
BlinkTheme.THEMES;             // [{id,label,mode,blurb}, …]
BlinkTheme.registerTheme({…}); // create a theme at runtime (see below)
```

Shipped themes: `neutral` (Catppuccin Mocha, default) · `nord` · `gruvbox` ·
`tokyonight` · `latte` (light). The picker lives in **Component Showcase.html**,
built from the kit's own primitives — switch there and the whole inventory
repaints live; the choice persists across reloads.

### The two rules that keep it honest

- **Lint:** raw palette (`--ctp-*` / hex) is confined to where colour is
  *defined* — `colors_and_type.css`, `registerTheme()` calls, and `theme.js`
  (the engine). **Components and app chrome reference intent tokens only**
  (`--fg`, `--accent`, `--bg-sunken`, `--state-ok`, `--domain-*`) and may not
  read `data-theme`. (The one doc-surface exception is `Inventory.jsx`, whose
  job is to *display* the raw palette.) Brand/domain glyphs paint through
  `--domain-*` families (so e.g. postgres stays "blue family" and recolours with
  the theme) — never a raw palette name.
- **Scoped boundary (only exception):** `data-theme` on a *subtree* re-themes
  just that subtree (e.g. a light preview inside a dark app). Deliberate, visible
  in markup — not per-component drift.

### Creating a theme

**Easy path — at runtime, from the app's own code** (no framework edits, mirrors
`registerGlyphs`). The theme is injected and shows up in the picker immediately:

```js
BlinkTheme.registerTheme({
  id: 'dracula', label: 'dracula', mode: 'dark', blurb: 'classic purple dark',
  palette: { base: '#282a36', surface1: '#44475a', text: '#f8f8f2',
             lavender: '#bd93f9', red: '#ff5555', green: '#50fa7b', /* … */ },
});
BlinkTheme.setTheme('dracula');
```

Only list the slots you want to change — the rest are inherited from `extends`
(default `'neutral'`), so a handful of accents is already a complete theme. Pass
`intent: { 'state-pending': 'var(--ctp-sky)', 'bg-focused': '…' }` to remap intent
roles too (the "vivid"/"neutral+" trick), and `select: true` to switch on register.
Component Showcase.html registers a `dracula` theme this way as a live example.

**Built-in path — for themes shipped with the framework.** Copy a `[data-theme]`
block in `colors_and_type.css`, fill all 26 `--ctp-*` slots in order, add one row
to `THEMES` in `theme.js`. Use this for curated, first-class themes; use the
runtime API for app-specific ones.

## Why a fictional product?

The design system was supplied without a concrete app or Figma file. Once
a real blink product exists, lift these components into a new kit
folder under `ui_kits/<product>/` and replace the fictional copy with the
real domain language. The structure stays the same.

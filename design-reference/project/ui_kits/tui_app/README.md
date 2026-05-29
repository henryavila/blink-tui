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
├── glyphs.js              ← core STATE / NAV / BOX / SPINNER + registerGlyphs/glyph registry
├── Pane.jsx               ← box-drawn pane with optional title
├── List.jsx               ← rows: checkbox + state + domain columns, windowed
├── Header.jsx             ← top status bar (mark + title + right slot)
├── Banner.jsx             ← one-line in-flow notice (info/success/warn)
├── DescriptionList.jsx    ← key/value block for detail panes
├── Footer.jsx             ← bottom hotkey bar (always visible)
├── Input.jsx              ← single-line text field with ▎ cursor
└── Dialog.jsx             ← modal: rounded lavender pane (lines or rich children)
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
- Domain glyphs registered by the app (`registerGlyphs(COMMON_DOMAINS)`) — blink
  core ships none
- Modal dialog as a focused (lavender) rounded pane that overlays
- Footer bar with hotkey chips in inverse video
- Cursor blink at 1 Hz, step-end (no fade)
- Braille spinner at 80 ms / frame, only while syncing

What it does **not** do: actual service management, hover styles, smooth
transitions, drop shadows, gradients, or any CSS borders. By contract.

## Why a fictional product?

The design system was supplied without a concrete app or Figma file. Once
a real blink product exists, lift these components into a new kit
folder under `ui_kits/<product>/` and replace the fictional copy with the
real domain language. The structure stays the same.

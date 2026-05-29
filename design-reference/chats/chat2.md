# Blink Camera App Design

_Started 2026-05-29 10:42 UTC_

---

## User

Create a example screen with all features/components of the blink

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: update_todos]_

_[tool: read_file]_

This is a rich, well-specified system — **blink**, a TUI design framework with a strict visual contract. I have everything I need: the components (`Pane`, `List`, `Footer`, `Input`, `Dialog`), the glyph constants, the Catppuccin Mocha tokens, and the contract rules. Let me build a single "kitchen-sink" screen that exercises every primitive while still reading like a real blink app.

_[tool: write_file]_

Now I'll build the showcase screen. I'll place it alongside the existing kit so it reuses the same components, glyphs, and CSS.

_[tool: write_file]_

Now the main showcase screen:

_[tool: done]_

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: str_replace_edit]_

Looks excellent — every primitive renders correctly. One small fix: the focus-legend line in the processes pane is clipped ("spc toggles s"). Let me shorten it.

_[tool: update_todos]_

_[tool: fork_verifier_agent]_

Built **`ui_kits/tui_app/Component Showcase.html`** — a single 120×40 blink app screen that puts every primitive on display, reusing the kit's own `Pane`/`List`/`Input`/`Dialog`/`Footer` components so it stays a true reference, not a one-off mock.

What's covered:
- **Panes** in all four border treatments (single, rounded, double/focused, error)
- **List** with `▶` focus, surface-1 focus fill, surface-0 selection, domain + state glyphs, right-aligned meta — plus a checkbox/expandable **tasks** list (`☑ ☐ ▸ ▾`)
- **Inputs**: default, focused (blinking `▎` cursor), and error variant
- **Glyph banks**: full state, navigation, and Nerd-Font domain sets, semantically coloured
- **Status & motion**: live braille spinner, a block-glyph progress bar (`█░`), state counts
- **Type tiers + accents**, inverse-video key chips ("bold")
- **Footer** hotkey bar, and three **dialogs** (help / delete / error)

It's keyboard-driven: `↑↓` move, `spc` select, `/` search, `d`/`e` open dialogs, `?` help — all per the blink contract (flexbox only, glyph borders, no CSS borders/shadows/transitions).

Verifier is running in the background; I'll flag anything it catches.


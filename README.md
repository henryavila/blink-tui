# blink

**a framework for building modern, elegant TUI apps.**

```
bl▎nk
```

blink is a thin layer over [Ink](https://github.com/vadimdemedes/ink) (React for
the terminal) that gives every app the same considered house style: Catppuccin
Mocha theming, dual-mode Nerd Font glyphs, box-drawing panes, keyboard-only
interaction — all on a strict character-cell grid.

> _if you can't draw it with characters, it doesn't belong in a blink app._

The name is always lowercase **blink**. The mark is the blinking cursor block —
the one motion the contract permits — accented in lavender.

---

## what it looks like

`svcd`, the bundled reference app, exercises every primitive at the 100×30
design target — two panes, a focused-pane border recolour, a list with state +
domain glyphs, a live status bar, modal dialogs, search, and the braille spinner:

```
 ▎ svcd · built with blink                                                                    ready
╔═ services (7) ═══════════════════════════════════════╗┌─ detail ─────────────────────────────────┐
║    ✓ postgres@14.10                    data/pg/main  ║│ docker                                   │
║    ✓ redis@7.2                           /var/redis  ║│                                          │
║  ▸ ◯ docker               28 containers · 4 stopped  ║│ state   ◯ starting                       │
║    ◐ nginx                       config out-of-date  ║│ path    28 containers · 4 stopped        │
║    ✓ node · api                    pid 4821 · :3000  ║│ port    —                                │
║    ✗ grafana                        missing on host  ║│                                          │
║    ✓ ssh-agent                        3 keys loaded  ║│ ↳ actions                                │
║                                                      ║│ ↯ a  apply now                           │
║                                                      ║│ ✗ d  remove                              │
╚══════════════════════════════════════════════════════╝└──────────────────────────────────────────┘
  tab  pane    /  search    a  apply    d  delete    ?  help    q  reset         ✓ 4  ◯ 1  ◐ 1  ✗ 1
```

Run it in your terminal (full colour + Nerd Font glyphs) and drive it with the
keyboard — `↑↓`/`j k`, `tab`, `/`, `a`, `d`, `?`, `q`:

```bash
npm run example
```

`npm run example:snapshot > shot.ansi` writes a single colour frame you can
`cat` or drop in docs (the block above is that frame, de-coloured for GitHub).

---

## install

```bash
npm i @henryavila/blink-tui ink react
```

`ink` and `react@18` are peer dependencies. blink ships ESM only.

## quick start

```tsx
import React from 'react';
import { render, Box, Text } from 'ink';
import {
  ThemeProvider, detectIconSet,
  Pane, List, Footer, Spinner,
  useTokens, useGlyph,
} from '@henryavila/blink-tui';

function App() {
  const t = useTokens();
  const g = useGlyph();
  return (
    <Box flexDirection="column" height={30}>
      <Box flexGrow={1} flexDirection="row">
        <Pane title="services (3)" focused flexBasis="56%">
          <List
            focusedId="pg"
            rows={[
              { id: 'pg', glyph: g('check'), glyphColor: t.stateOk, label: 'postgres@14.10', meta: 'data/pg' },
              { id: 'redis', glyph: g('check'), glyphColor: t.stateOk, label: 'redis@7.2' },
              { id: 'nginx', glyph: g('half'), glyphColor: t.stateDrift, label: 'nginx', meta: 'drift' },
            ]}
          />
        </Pane>
        <Pane title="detail" flexBasis="44%">
          <Text color={t.fg}>state running</Text>
        </Pane>
      </Box>
      <Footer
        keys={[
          { k: 'tab', desc: 'pane' },
          { k: 'enter', desc: 'open' },
          { k: 'q', desc: 'quit' },
        ]}
        right="3 of 3"
      />
    </Box>
  );
}

const iconSet = await detectIconSet();
render(
  <ThemeProvider iconSet={iconSet}>
    <App />
  </ThemeProvider>,
);
```

Run any blink app with [`tsx`](https://github.com/privatenumber/tsx):
`npx tsx app.tsx`. The terminal is the preview — there is no browser step.

---

## the contract

Everything a blink app renders flows from these rules. They are not style
suggestions; they are what makes blink apps look like blink apps.

- **One family, one size, one weight.** CaskaydiaMono Nerd Font, 14px, 400.
  "Bold" is **inverse video**, not 700.
- **Catppuccin Mocha, always.** Background is `base` (`#1e1e2e`) — never a
  gradient, image, or blur. Three text tiers (`fg` / `fgMuted` / `fgDim`); past
  that, reach for an accent, never a fourth grey. Semantic colour lives on
  **glyphs**, not body text (green is `✓`, not the word "ok").
- **Every border is a glyph.** Box-drawing characters via `Pane` — never a CSS
  border, radius, or outline (Ink has none anyway; the discipline is in the
  composition). Single line is default; **double line** is the focused pane or a
  modal — elevation is border *weight*, not shadow.
- **Flexbox only.** `<Box flexDirection="row|column">`, nested for multi-pane.
  No absolute positioning, no z-index. Target window 100×30; mobile-mosh
  fallback 60×20 (read `useStdoutDimensions()` to switch layouts).
- **Keyboard only.** No *mouse* scroll, no scrollbar, no wheel, no hover. Focus
  is character-based: the `▸` caret, a surface fill, or a recoloured (lavender)
  border. A list longer than its container is **paged by the keyboard** — focus
  moves, the window follows (`List height` / `useListWindow`), with `▴ N more` /
  `▾ N more` as the only affordance. That is not mouse-scroll; it is how the
  60×20 target is honoured for any non-trivial list.
- **One animation.** The cursor blinks at 1 Hz, step-end (`useBlink`). A spinner
  may cycle (`useSpinnerFrame` + `Spinner`). Nothing else *moves* — no fades, no
  transitions, no transforms. Content re-rendering on new data (a windowed list
  following its focus, a `LogView` following its tail) is **not motion** — it is
  the same frame redrawn with new content, which the rule does not govern.
- **No emoji, no SVG, no raster.** Status is carried by glyphs from the palette
  (`✓ ✗ ◯ ◐ ⚠ ↻`). The logo is characters.

### copy voice

Terse, lowercase, command-shaped — like output from a well-engineered CLI.
Second person imperative ("press `?` for help"). No exclamation marks. State,
then action (`3 changes  ↳ press a to apply`). `UPPER CASE` is reserved for KEY
indicators.

---

## api

### theme

| export | what |
|---|---|
| `ThemeProvider` | wrap your app once; takes `theme` (default `mocha`) + `iconSet` |
| `useTheme()` / `useTokens()` / `useIconSet()` | read theme / semantic tokens / resolved icon set |
| `mocha`, `catppuccinMocha`, `mochaTokens` | the Catppuccin Mocha theme, raw palette, semantic tokens |
| `SemanticTokens`, `Theme`, `Palette` | types |

Components consume **semantic tokens** (`tokens.fg`, `tokens.accent`,
`tokens.stateOk`, …) — never raw hex. Swapping in a light theme later is a
matter of new tokens, not touched components.

### glyphs (dual-mode)

Every glyph has three variants — `{ nerd, unicode, ascii }` — so an app never
shows tofu (□). `detectIconSet()` picks the mode once at startup; the worst case
is text-shaped fallbacks (`[x]`, `pg`), never broken boxes.

| export | what |
|---|---|
| `detectIconSet(opts?)` | resolve `'nerd' \| 'unicode' \| 'ascii'` (env → user pref → font marker → terminal hints → CI → default) |
| `useGlyph()` | `(name) => string`, bound to the icon set in context |
| `glyph(name, set)` | low-level resolver |
| `registerGlyphs({...})` | add app-domain glyphs (e.g. your product's logos) |
| `boxChars`, `spinnerFor`, `blocks`, `blocksH` | border sets, spinner frames, block-shade ramp, eighth-block ramp (for `ProgressBar`) |
| `cellWidth(str)` | terminal cell width — the same measure `List`/`Footer` use, so custom rows align exactly |

Built-in names: states `check cross circle half checkboxOn checkboxOff warn
rerun`; nav `focus collapsed expanded depends flow back moreAbove moreBelow`;
domains `database mysql postgresql redis docker github git ssh nodejs php python
vim apple linux ubuntu font ai bolt`.

Override env vars: `BLINK_ICON_SET=nerd|unicode|ascii`, `BLINK_NERD_FONT=1|0`,
`BLINK_ASCII=1`.

### components

| component | what |
|---|---|
| `Pane` | box-drawn rectangle with a title inside the top border; `focused`/`variant` drive weight + colour |
| `List` / `ListRow` | rows with `▸` focus caret, state + domain glyphs, right-aligned meta, selection fill; set `height` to window a long list |
| `LogView` | bottom-anchored, height-bounded tail of a growing line stream (subprocess output, build logs); `follow`/`wrap` |
| `Footer` | the always-visible bottom hotkey bar; inverse-video key chips + a right status slot |
| `Input` / `Cursor` | single-line field with the blinking `▎` cursor (presentational — wire keys with Ink's `useInput`) |
| `Dialog` | centred double-border modal; plain-text `lines` or a rich `children` body; the primary action renders in inverse-accent |
| `Banner` | one-line, non-blocking in-flow notice; `tone` (`info`/`warn`/`success`) + optional glyph |
| `Spinner` | braille spinner (ASCII fallback), driven by `useSpinnerFrame` |
| `ProgressBar` | determinate bar from the eighth-block ramp; `value` (0..1) + `width` |

### hooks

| hook | what |
|---|---|
| `useStdoutDimensions()` | live `{ columns, rows }`, updates on resize — switch 100×30 ↔ 60×20 layouts |
| `useBlink(active?, hz?)` | the 1 Hz step-end cursor blink |
| `useSpinnerFrame({active?, intervalMs?})` | a frame counter for spinners (icon-set agnostic) |
| `useListWindow({rowCount, focusedIndex, height, ...})` | the windowing engine behind `List height` — reusable for any keyboard-paged viewport |
| `useListNavigation({ids, ...})` | headless focus movement (next/prev/first/last/seek) — you own `useInput`, it owns the cursor |
| `useListSelection({ids, mode, min?, max?})` | headless single/multi selection with min/max guards; feeds `List selectedIds` |

The three `useList*` hooks are **headless** (the [downshift](https://www.downshift-js.com/)/react-aria pattern): blink owns the *logic*, the app owns the keys (it calls the hooks' intent methods from its own `useInput`). No blink component reads keystrokes — the presentational contract stays intact.

---

## why blink

Ink gives you flexbox and `<Text>`. blink gives you the *decisions* — the
palette, the glyph fallback strategy, the border discipline, the focus model —
so every TUI you build is consistent and considered from the first render
instead of re-litigated per app. Build the app; inherit the house style.

The design system this codifies (palette, glyphs, the full visual contract, and
a reference app) lives in [`design-reference/`](./design-reference/), exported
from [Claude Design](https://claude.ai/design). `SKILL.md` makes it loadable as
an Agent Skill.

## development

```bash
npm install
npm run build         # tsup → dist/ (ESM + .d.ts)
npm test              # vitest + ink-testing-library
npm run typecheck     # tsc --noEmit
npm run example       # the demo launcher — pick a screen from the menu
```

`npm run example` (`examples/index.tsx`) opens a **launcher**: a menu of demo
screens you open with ↑↓ + enter, built from blink primitives itself. Two screens
ship — press `q` inside one to return to the menu:

- **svcd** (`examples/svcd.tsx`) — the narrative reference app, a services
  manager that reads like a real tool (Pane · List · Footer · Input · Dialog ·
  Spinner).
- **gallery** (`examples/gallery.tsx`) — the kitchen sink: every primitive on
  one screen, driven by the headless `useList*` hooks (windowed List · LogView ·
  Banner · ProgressBar · selection/navigation/windowing hooks).

## license

MIT © Henry Avila

# Spec — component implementation (maintainer design pass)

> **⚠ Superseded (historical).** Written before the *intent, not style*
> migration. For the current API see the root `README.md` and `design-reference/`:
> `Pane`/`Dialog` take `tone` (no `variant`/`double` — there is no double border),
> `List`/`DescriptionList` rows take intent (`state`, `selected`, `domain` name),
> and domain glyphs are app-registered, not core. The `variant`/`double` shapes
> below are pre-migration and kept only for provenance.
>
> **Status:** implementable spec. This is the maintainer's design pass over
> `HANDOFF-component-requests.md` — it resolves the two open decisions and turns
> each request into an API + behaviour + tests an engineer can build against.
> **Prime directive (inherited):** every primitive here stays **generic and
> app-agnostic**. Nothing below references the consumer's domain; all examples
> are domain-neutral. If an API only serves one app, it does not ship.

This spec supersedes the handoff's "Proposed API" sketches where they differ —
the differences come from one finding made during review:

> **The behaviour the consumer actually wants from a windowed list — *"the caret
> travels to the edge of the screen, then the window scrolls"* — cannot be
> computed from `(focusedId, height)` alone. It requires remembering the window
> offset between renders.** So R1's "no new state" claim is wrong, and R1
> collapses into the same architectural question as R3 (Decision B). They are
> specced together, around one engine: **`useListWindow`**.

---

## 0 · resolved open decisions

These gate everything else, so they come first.

### Decision A — "no scroll" does **not** forbid a keyboard-driven window · **RESOLVED: allow**

Read the contract line as **"no *mouse* scroll"**: no scrollbar, no wheel, no
hover, no drag. A window that moves **only because the keyboard moved focus**
(R1) and a viewport that advances **only because new content arrived** (R2 tail)
are both sanctioned — they are *required* to honour the 60×20 target, which any
non-trivial list exceeds. The scroll is real but **invisible**: no bar, no
thumb; the `▴ N more` / `▾ N more` markers are the *only* affordance that there
is more, which is exactly what makes the otherwise-invisible scroll legible.

**README edits required** (see §9): rewrite the "no scroll" and "nothing else
moves" lines so the sanctioned cases are explicit instead of contradicted.

### Decision B — components stay presentational; **logic ships as headless hooks** · **RESOLVED: headless**

blink keeps `useInput` out of `src/`. The reusable *logic* (window offset,
focus movement, selection invariants) ships as **headless hooks** that the app
wires to its own `useInput`. The distinction that makes this consistent with the
contract:

> **View-state ≠ the state the contract reserves for the app.** The contract
> says the app owns *keystrokes, focus, and selection*. The **window offset**
> (where the viewport sits) is *view-state* — the same category as a scroll
> position. A hook (or a component's internal `ref`) may own view-state without
> violating "app owns keys." `focusedId` and `selectedIds` remain the app's.

Consequence for ergonomics: **`List` may consume `useListWindow` internally** so
that an app gets windowing by adding one prop (`height`), while the engine stays
independently reusable for non-`List` callers. That hybrid is the recommended
shape and is specced below.

---

## 1 · shared additions (glyphs + tokens)

Several requests need the same new material; defining it once keeps it canonical.

### 1a · overflow-marker glyphs — `navGlyphs` additions (R1, R2)

`▴` is **not** in the palette today; add a dedicated semantic pair rather than
overloading `expanded`/`collapsed` (whose meaning is "chevron", not "more"):

```ts
// src/glyphs/glyphs.ts — add to navGlyphs
moreAbove: { nerd: '▴', unicode: '▴', ascii: '^' },
moreBelow: { nerd: '▾', unicode: '▾', ascii: 'v' },
```

### 1b · horizontal eighth-block ramp — `blocksH` (R7)

`blocks` only has 4 shade levels (`█▓▒░`) — not enough for a smooth determinate
bar. Add the 8-step horizontal partials (the standard left-to-right eighths),
indexed by eighth `0..8`:

```ts
// src/glyphs/glyphs.ts — new export, the sanctioned material for ProgressBar
export const blocksH = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'] as const;
// index = eighths filled (0..8). ascii icon set has no partials → see R7 degrade rule.
```

### 1c · tokens — none added

Confirmed against `src/theme/tokens.ts`: every tone/colour the requests need
already exists (`accent`, `stateOk`, `stateWarn`, `stateInfo`, `fgDim`, …). No
new tokens.

---

## 2 · R1 + `useListWindow` — windowed list · **P1**

**Kind:** new headless hook (`useListWindow`) + additive change to `List`.

### Engine: `useListWindow`

Pure windowing logic, generic to *any* fixed-height viewport over a flat row
array (not tied to `List` or `ListRowData`). Owns the window offset across
renders.

```ts
export interface UseListWindowOptions {
  /** Total number of rows. */
  rowCount: number;
  /** Index of the focused row; `< 0` or `null` = no focus-follow (window holds). */
  focusedIndex: number | null;
  /** Max rows the viewport renders, INCLUDING any marker rows. */
  height: number;
  /** Context rows kept between the caret and the edge before the window scrolls.
   *  Default 0 → scroll only when the caret would leave the last content row. */
  scrolloff?: number;
  /** Reserve a chrome row for the ▴/▾ "N more" marker on an overflowing side.
   *  Default true. */
  overflowMarkers?: boolean;
}

export interface ListWindow {
  /** First visible CONTENT row index (inclusive). */
  start: number;
  /** One past the last visible content row. Slice rows with `rows.slice(start, end)`. */
  end: number;
  /** Rows hidden above / below (0 = none). Drive the markers off these. */
  aboveCount: number;
  belowCount: number;
}

export function useListWindow(opts: UseListWindowOptions): ListWindow;
```

**Behaviour.**

- `rowCount <= height` → everything fits: `{ start: 0, end: rowCount, above: 0, below: 0 }`, no markers.
- `rowCount > height` → overflow exists, so ≥1 marker shows (when `overflowMarkers`). **Markers are separate chrome rows, not overlays** — content rows = `height − (showAbove?1:0) − (showBelow?1:0)`, and the rendered total (`content + markers`) always equals `height`, so the window never exceeds its container.
- The caret is **always inside the content band** — a marker row is never the focused row, so the focused item is never hidden behind "N more".
- With `scrolloff = 0`, the caret may sit on the first or last **content** row (the row adjacent to a marker, i.e. the last *item* visible on screen). Moving focus past it shifts the window by one — *the window follows the focus, the focus does not jump.* This is the "travel to the edge, then scroll" behaviour, and it falls out of the engine: **the hook never sees a keystroke; the app moves `focusedIndex`, the hook re-derives the window to keep it in band.**
- The window is recomputed each render to contain `focusedIndex` **for any jump**, not just ±1 — `focusFirst`/`focusLast`/`PageDn` work without the engine assuming single-step movement.
- `focusedIndex` null/`< 0` → the window **holds** its current offset (clamped to valid range); no follow.

**Reference algorithm** (the hook holds `start` in a `useRef`, seeds it `0`, and
updates it from the computation each render — ref-in-render is fine, it is
derived view-state, not React state):

```
computeWindow(prevStart, { rowCount: n, focusedIndex: i, height: H, scrolloff: s = 0, markers: M = true }):
  if H <= 0:        return { start: 0, end: 0, above: 0, below: 0 }
  if n <= H:        return { start: 0, end: n, above: 0, below: 0 }   // fits, no markers

  start = clamp(prevStart, 0, n - 1)
  // Marker reservation and the window are mutually dependent; iterate to the
  // fixed point. Capacity flips at most once (H-1 ⇄ H-2), so 2 passes converge.
  for pass in 0..1:
    showAbove = M and start > 0
    provEnd   = start + (H - (showAbove ? 1 : 0))
    showBelow = M and provEnd < n
    content   = max(1, H - (showAbove ? 1 : 0) - (showBelow ? 1 : 0))
    if i != null and i >= 0:
      m = min(s, floor((content - 1) / 2))          // clamp margin so band never collapses
      if      i < start + m:            start = i - m
      else if i >= start + content - m: start = i - content + 1 + m
    start = clamp(start, 0, n - content)
  end = start + content
  return { start, end, above: start, below: n - end }
```

### Change: `List`

Additive props; default behaviour (render all rows) unchanged when `height` is omitted.

```ts
export interface ListProps {
  rows: ListRowData[];
  focusedId?: string | null;
  selectedIds?: Set<string>;
  /** Max rows to render incl. markers. Omit = render all (today's behaviour). */
  height?: number;
  /** Context rows before the window scrolls. Default 0. */
  scrolloff?: number;
  /** Draw "▴ N more" / "▾ N more" on overflowing sides. Default true. */
  overflowMarkers?: boolean;
}
```

When `height` is set, `List` internally derives `focusedIndex` from `focusedId`
(`rows.findIndex(r => r.id === focusedId)`), calls `useListWindow`, renders
`rows.slice(start, end)`, and draws dim marker rows using `navGlyphs.moreAbove`
/ `navGlyphs.moreBelow` + the `aboveCount` / `belowCount` (copy: `▴ {n} more` /
`▾ {n} more`, in `fgDim`). So an app gets full windowing by adding `height={n}`
and changing nothing else.

**Contract.** Sanctioned by Decision A. No new app-visible state — `focusedId`
stays the app's; only the offset (view-state) lives in the hook.

**Tests** (`ink-testing-library`):
- `rows ≫ height` renders exactly `height` rows total (content + markers).
- focused row is always present in output, for both ±1 moves and direct jumps.
- moving focus past the bottom content row shifts the window by exactly one.
- `scrolloff: 1` keeps one context row below the caret before scrolling.
- top of list → no `▴` marker; bottom → no `▾`; middle → both.
- `aboveCount`/`belowCount` equal the real hidden counts (no off-by-one vs markers).
- `focusedIndex: null` holds the window; `height` omitted renders all rows (regression).

---

## 3 · R2 — `LogView` tailing viewport · **P1**

**Kind:** new presentational primitive (owns tail view-state, per Decision B).

```ts
export interface LogViewProps {
  /** Full line buffer; LogView shows the tail that fits `height`. */
  lines: string[];
  /** Viewport height in rows (incl. an overflow marker row when not at an edge). */
  height: number;
  /** Follow the newest line (default). false = freeze the current window. */
  follow?: boolean;
  /** Wrap long lines (default) vs truncate to width. */
  wrap?: boolean;
  /** Viewport width in cells. Omit = measure own width via Ink `measureElement`. */
  width?: number;
}
```

**Behaviour.**

- **Bottom-anchored**, the mirror of R1's focus-anchored window. Holds a
  `bottomOffset` ref = visual rows hidden *below* the viewport (`0` = pinned to
  newest).
- `follow: true` forces `bottomOffset = 0` every render — newest line always
  visible, oldest fall off the top.
- `follow: false` freezes `bottomOffset` at its current value (the app flips
  `follow` to pause; without a key API the window simply holds).
- **Wrap math:** when `wrap` is true a logical line spans ⌈`cellWidth(line)/width`⌉
  visual rows, so the tail is counted in **visual rows, not array entries**. This
  needs `width`; if not passed, measure via `measureElement` on a ref (Ink 5).
  Document that wrap accuracy depends on a known width. `wrap: false` truncates
  each line to `width` → 1 entry = 1 visual row (trivial tail).
- Marker: `▴ {n} more` (older lines clipped above) using `navGlyphs.moreAbove`,
  in `fgDim`. No bottom marker while following (we are at newest); when frozen
  and scrolled off the bottom, a `▾ {n} more` may show.

**Why not `List` or Ink `<Static>`:** `List` windows around a *focused* row; a
log has no focus, it follows the bottom. Ink `<Static>` is append-only permanent
scrollback that grows *past* the screen — the opposite of a height-bounded
pinned region. Confirmed absent from blink (no `Static`/`Viewport`/`scroll` in
`src/`).

**Contract.** Decision A's second clause: the window advancing on new data (no
keystroke) is **content re-render, not motion** under the one-animation rule.
Pairs with `Spinner` (in-progress) and a state glyph in the surrounding `Pane`.

**Tests:**
- `lines.length > height` shows only the last `height` (truncate mode, exact).
- appending a line drops the oldest when following.
- `follow: false` freezes the window across new appends.
- wrap vs truncate output snapshots at a fixed `width`.
- a single line longer than `width` occupies ⌈len/width⌉ rows when wrapping.

---

## 4 · R3 — headless selection/navigation hooks · **P2**

**Kind:** headless hooks (Decision B). **Two hooks, split by concern** — focus
*navigation* is generic to any list (even read-only menus); *selection* layers on
top. Conflating them into one `useListSelection` would force selection on callers
that only want a cursor.

> **Genericity rule (the review's #1 risk):** the hooks expose **intent methods**
> (`focusNext()`, `toggle(id)`), **never a baked-in `onKey`**. Hard-coding which
> key does what would smuggle one app's keymap into blink. The app owns the
> `useInput` and maps keys → intents.

### `useListNavigation`

```ts
export interface UseListNavigationOptions {
  /** Ordered row ids. */
  ids: string[];
  /** Controlled focus (optional). Omit = hook owns it. */
  focusedId?: string | null;
  onFocusChange?: (id: string) => void;
  /** Wrap first↔last vs clamp at the ends. Default false (clamp). */
  wrap?: boolean;
}
export interface ListNavigation {
  focusedId: string | null;
  focusedIndex: number;          // feed straight to useListWindow
  focusNext(): void;
  focusPrev(): void;
  focusFirst(): void;
  focusLast(): void;
  focusTo(id: string): void;
}
export function useListNavigation(opts: UseListNavigationOptions): ListNavigation;
```

### `useListSelection`

```ts
export type SelectionMode = 'single' | 'multi';
export interface UseListSelectionOptions {
  ids: string[];
  mode: SelectionMode;
  /** multi only: minimum that must stay selected (deselect below is blocked). */
  min?: number;
  /** multi only: max selectable (select above is blocked). */
  max?: number;
  initial?: Iterable<string>;
  onChange?: (selected: Set<string>) => void;
}
export interface ListSelection {
  selectedIds: Set<string>;       // feed straight to <List selectedIds=...>
  isSelected(id: string): boolean;
  toggle(id: string): boolean;    // false = blocked by min/max
  selectOnly(id: string): void;   // single-select semantics
  clear(): void;
  /** True when the last toggle was blocked — app renders it as Input.error. */
  blocked: boolean;
}
export function useListSelection(opts: UseListSelectionOptions): ListSelection;
```

**App wiring** (illustrative, domain-neutral — the keymap is the app's):

```tsx
const nav = useListNavigation({ ids });
const sel = useListSelection({ ids, mode: 'multi', min: 1 });
useInput((input, key) => {           // ← app owns this, imported from `ink`
  if (key.downArrow) nav.focusNext();
  if (key.upArrow)   nav.focusPrev();
  if (input === ' ' && nav.focusedId) sel.toggle(nav.focusedId);
});
return (
  <List rows={rows} focusedId={nav.focusedId} selectedIds={sel.selectedIds} height={20} />
);
```

`List` handles the windowing internally (§2), so the app composes three hooks
and never re-derives offset, toggle, or single-select invariants.

**Form orchestration stays app-level** (per handoff §3): which field is focused,
value collection, cross-field validation, submit gating. Only per-control
selection/navigation logic is in blink.

**Tests:** single-select keeps exactly one id; multi toggles on/off;
`min` blocks deselect below the floor and sets `blocked`; `max` blocks select
above the ceiling; nav clamps at ends (or wraps when `wrap`); `focusedIndex`
tracks `focusedId`.

### Optional follow-on — `useTextInput` + caret-in-string

Bracketed in the handoff as the same Decision-B question applied to `Input`.
Ship only if/when an editable field is needed; not required for the above.

```ts
export interface UseTextInputOptions {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: (value: string) => void;
}
export interface TextInput {
  value: string;
  cursor: number;                 // caret index within value
  insert(s: string): void; backspace(): void; del(): void;
  left(): void; right(): void; home(): void; end(): void;
}
```

Complement with an additive `cursorAt?: number` on `Cursor`/`Input` so the caret
can sit **mid-string** (today `Cursor` only *trails* the value —
`CursorInput.tsx:68`). Default keeps today's trailing behaviour.

---

## 5 · R4 — re-export `cellWidth` · **P2** · one line

`cellWidth` is the canonical width contract (`textWidth.ts:18`), used internally
by `List` columns and `Footer` chip-dropping, but **not exported**; `string-width`
is a direct dep (`package.json`). Without the export, consumers vendor their own
`string-width` and version-skew from the one Ink/blink use, drifting fixed-width
cells.

```ts
// src/index.ts
export { cellWidth } from './textWidth.js';
```

**Do this first — it is free and unblocks any custom-row alignment.** Tests:
already covered by `List`/`Footer`; optionally assert wide-glyph (`⚠` → 2) and
ascii-fallback (`[x]` → 3).

---

## 6 · R5 — `Banner` / `Notice` · **P3**

**Kind:** new presentational primitive. **Purely presentational** — `dismissAfter`
from the handoff is **dropped** from the component (a timer would make Banner the
first stateful display and brush the one-animation rule). Auto-dismiss is an app
concern (mount/unmount); offer a tiny optional `useTimedFlag(ms)` hook if needed,
but Banner itself is stateless.

```ts
export interface BannerProps {
  children?: React.ReactNode;
  text?: string;                       // convenience; children wins when both given
  tone?: 'info' | 'warn' | 'success';  // default 'info'
  glyph?: string;                      // resolved glyph string, optional leading slot
}
```

**Token mapping** (confirmed names from `tokens.ts`): `info → stateInfo`,
`warn → stateWarn`, `success → stateOk`. One accent-tinted in-flow line, optional
leading glyph, no border, no focus steal. Honours the copy rule "state, then
action".

**Tests:** renders one line with the right token per tone; glyph slot optional;
`children` wins over `text`.

---

## 7 · R6 — `Dialog` body accepts `ReactNode` · **P3**

**Kind:** additive change. Today `DialogProps.lines?: string[]` (`Dialog.tsx:22`)
can't host a `List` or glyph-decorated rows.

```ts
export interface DialogProps {
  title: string;
  variant?: 'default' | 'error';
  lines?: string[];           // convenience for plain-text
  children?: React.ReactNode; // rich body; wins over `lines` when both given
  actions?: DialogAction[];
  width?: number;
}
```

`children` renders inside the existing `paddingX={1}` body column (`Dialog.tsx:56`),
between the framing blank lines, in place of the `lines.map`. Fully backward
compatible.

**Tests:** `children` renders inside the frame; `lines` still works unchanged;
both-supplied prefers `children`.

---

## 8 · R7 — `ProgressBar` · **P3** (gated on §1b glyphs)

**Kind:** new primitive. **Do not build before `blocksH` (§1b) lands** — without
the eighth-block ramp the bar quantises to whole cells (serrated).

```ts
export interface ProgressBarProps {
  value: number;        // 0..1, clamped
  width: number;        // cells
  color?: string;       // filled colour; default tokens.accent
  trackColor?: string;  // empty-rail colour; default tokens.border (surface1, the DS `bar-rest`)
}
```

**Algorithm:** `filled = clamp(value, 0, 1) * width` cells. Full cells =
`floor(filled)` rendered `blocksH[8]` (`█`); the fractional cell = `blocksH[round(frac * 8)]`;
the remainder is a visible `░` rail (`blocks.light`) in the track colour, matching
the DS `[████░░░░]` treatment. **ascii degrade:** the `ascii` icon set
has no partials — render full cells as `#`, drop the fractional cell (`floor`),
track as space. (Resolve via the icon set from context, like every other glyph.)

**Tests:** `value` maps to the right filled-cell count across `width`; clamps at
0 and 1; fractional cell picks the correct eighth; ascii set renders whole-cell
`#` with no partial.

---

## 9 · README edits required (Decision A)

`README.md:137` and `:139-141` currently *contradict* the sanctioned cases.
Rewrite:

- **`:137` keyboard-only line** — change "no scroll" to: *"no **mouse** scroll,
  no scrollbar, no wheel, no hover. A list longer than its container is paged by
  the keyboard: focus moves, the window follows (`useListWindow` / `List
  height`), with `▴ N more` / `▾ N more` as the only affordance — there is no
  scrollbar."*
- **`:139-141` one-animation line** — add: *"Content re-rendering on new data —
  a windowed list following its focus, a `LogView` following its tail — is not
  motion; it is the same frame redrawn with new content. The one-animation rule
  governs decorative motion (fades, transitions), not content updates."*

---

## 10 · new public surface (index.ts)

```ts
// hooks
export { useListWindow } from './hooks/useListWindow.js';
export type { UseListWindowOptions, ListWindow } from './hooks/useListWindow.js';
export { useListNavigation } from './hooks/useListNavigation.js';
export type { UseListNavigationOptions, ListNavigation } from './hooks/useListNavigation.js';
export { useListSelection } from './hooks/useListSelection.js';
export type { UseListSelectionOptions, ListSelection, SelectionMode } from './hooks/useListSelection.js';
// useTextInput — optional follow-on

// components
export { LogView } from './components/LogView.js';
export type { LogViewProps } from './components/LogView.js';
export { Banner } from './components/Banner.js';
export type { BannerProps } from './components/Banner.js';
export { ProgressBar } from './components/ProgressBar.js';
export type { ProgressBarProps } from './components/ProgressBar.js';

// utilities + glyph material
export { cellWidth } from './textWidth.js';
export { blocksH } from './glyphs/glyphs.js';
// navGlyphs gains moreAbove / moreBelow (already exported)
// List gains height / scrolloff / overflowMarkers; Dialog gains children;
// Cursor/Input gain optional cursorAt — all additive, existing exports unchanged.
```

---

## 11 · build order

1. **R4** (`cellWidth` export) — free, unblocks alignment now.
2. **§1a glyphs** (`moreAbove`/`moreBelow`) + **§1b** (`blocksH`) — material the rest needs.
3. **`useListWindow` + R1 `List` change** — highest reuse; lands the windowing engine.
4. **R2 `LogView`** — reuses the bottom-anchored mirror of the window concept.
5. **R3 hooks** (`useListNavigation`, `useListSelection`) — depend on Decision B (resolved).
6. **R5 / R6 / R7** — independent P3s, any order; R7 after §1b.
7. **§9 README edits** — alongside R1/R2 so the contract and the code agree.

> R1 and R2 share a *thin* common core (clamp a window to a height + emit
> overflow markers) but **diverge in offset policy** — R1 is focus-anchored, R2
> is bottom-anchored with wrap-aware visual-row counting. Extract the clamp/marker
> helper if convenient, but do **not** force one abstraction over both.

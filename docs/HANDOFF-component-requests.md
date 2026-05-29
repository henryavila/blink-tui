# Handoff — component requests from a downstream consumer

> **⚠ Superseded (historical).** Written before the *intent, not style*
> migration. The current contract is in the root `README.md` and
> `design-reference/`: components take semantic intent (`tone`, `state`,
> `selected`, `domain` name), there is **no double-line border** (focus/modals
> are colour, not weight), and domain glyphs are **app-registered**, not core.
> API snippets below (`Pane variant`/`double`, `Dialog variant`, etc.) are the
> pre-migration shapes — kept for provenance, not as current truth.
>
> **Status:** request / design input. Nothing here is implemented.
> **Audience:** whoever creates or changes blink primitives.
> **Prime directive:** every primitive proposed below **must stay generic and
> app-agnostic**. The consumer driving these requests is one example, not the
> design target. If an API only makes sense for one app, it does not belong in
> blink — push it back to the consumer. Examples in this doc are deliberately
> domain-neutral for that reason.

---

## who is asking, and why this exists

The consumer is a **multi-screen, full-terminal configuration wizard** —
keyboard-driven, runs over `ssh`/`mosh`, targets the same 100×30 / 60×20
windows blink already targets. It is one instance of the keyboard-driven
multi-screen class blink serves, not a design target — the profile here is
illustrative (per the prime directive). It is the first real app built on blink
beyond `svcd`, and building it surfaced a handful of places where the current
primitives stop short.

This doc is the consumer's side of the contract: *here is exactly what I need
from blink, framed generically, so you can decide what to build, what to change,
and what to hand back to me as app-level work.* It is split into:

1. **Ground truth** — what blink gives today (so we share a baseline).
2. **Requests** — generic primitives to add or change, each a self-contained spec.
3. **Non-requests** — work the consumer will own, listed so it never leaks into blink.
4. **Open design decisions** — two contract tensions only the maintainer can resolve.

The split that governs every request: **primitive vs app-level.** A primitive is
reusable, domain-neutral, and carries logic generic across apps. App-level work
is composition, domain state machines, and anything config-/schema-specific —
that stays in the consumer. When in doubt, the request says which side it lands
on and why.

---

## 1 · ground truth — what blink provides today

Confirmed against source so the requests below are precise, not vibes.

| Area | Today | Reference |
|---|---|---|
| Theme | `ThemeProvider` + `useTheme`/`useTokens`/`useIconSet`, full Catppuccin Mocha (26 semantic tokens) | `src/theme/*` |
| Glyphs | `detectIconSet()` 6-step cascade, `glyph()`/`useGlyph()`/`registerGlyphs()`, strict `{nerd,unicode,ascii}` contract, unknown name returns the name (never tofu) | `src/glyphs/*` |
| Dimensions | `useStdoutDimensions()` → live `{columns, rows}` on SIGWINCH, 80×24 non-TTY fallback | `src/hooks/useStdoutDimensions.ts` |
| Pane | title-in-border, `focused` recolour (double lavender), `variant` (`default`/`double`/`error`/`rounded`), flex sizing | `src/components/Pane.tsx` |
| List | flat `rows: ListRowData[]` + `focusedId` + `selectedIds`; per-row domain/state glyph, right-aligned `meta`, focus caret, selection fill; columns auto-width to widest cell | `src/components/List.tsx` |
| Footer | inverse-video hotkey chips + right status slot, greedy whole-chip drop when narrow | `src/components/Footer.tsx` |
| Input/Cursor | single-line **presentational** field (app owns keys), `error` line, blinking `▎` cursor that trails the value | `src/components/CursorInput.tsx` |
| Dialog | centred full-screen-replacement modal, `lines: string[]` body, `actions[]` with one inverse-accent primary chip, `width` (default 44) | `src/components/Dialog.tsx` |
| Spinner | braille / ascii (`spinnerFor`), `active=false` rests with no timer | `src/components/Spinner.tsx` |

**Two framework-wide facts that shape every request below:**

- **blink is 100% presentational.** `useInput` appears **nowhere** in `src/`. No
  component owns keystrokes, focus, or selection state — the app does, and feeds
  components their state as props (`CursorInput.tsx:44`: *"the app feeds `value`
  and owns the keys"*; `List` takes `focusedId`/`selectedIds` as props). This is
  a deliberate, documented stance, and it is the thing several requests below
  bump into.
- **Nothing windows or scrolls.** `List` renders **every** row
  (`List.tsx:165` `rows.map(...)`); `ListProps` is `{ rows, focusedId,
  selectedIds }` with no `height`/`offset` (`List.tsx:47-53`). The contract says
  *"no scroll"* (`README.md:136`) while also targeting a 60×20 fallback
  (`README.md:134`). Those two pull against each other the moment content
  exceeds the window — see **R1** and **Open decision A**.

---

## 2 · requests

Priority key: **P1** = blocks clean screens, highest reuse · **P2** = significant
friction · **P3** = nice-to-have.

Each request states whether it is a **new primitive**, a **change to an existing
primitive**, or a **headless hook**, plus the contract considerations and
suggested tests.

---

### R1 · Windowed list — `List` that fits its container · **P1** · change

**Generic problem.** Any list longer than the rows available to it. A 40-entry
settings list in a 20-row pane; a file picker; search results. Today `List`
draws all rows and Ink silently clips the overflow with no affordance — the user
cannot tell there is more, and the focused row can scroll off-screen entirely.
Every consumer re-derives the same offset math (window start, keep-focused-row
visible, "N more above/below" markers). That boilerplate should live in blink
once.

**Why a primitive, not app code.** It recurs in essentially every list-bearing
screen, and it is pure presentation: given `rows`, `focusedId`, and a `height`,
the visible window is a deterministic function. The app still owns focus
movement (keys) — **`List` stays presentational**; it just slices a window
around the focused id instead of rendering the whole array. So this request does
**not** break the "app owns keys" stance.

**Current state.** `List.tsx:47-53` (props), `List.tsx:163-178` (render).

**Proposed API** (additive; default behaviour unchanged when `height` is omitted):

```ts
interface ListProps {
  rows: ListRowData[];
  focusedId?: string | null;
  selectedIds?: Set<string>;
  /** Max rows to render. Omit = render all (today's behaviour). */
  height?: number;
  /** Reserve top/bottom rows for "N more" markers when content overflows. Default true. */
  overflowMarkers?: boolean;
}
```

Behaviour: when `rows.length > height`, render a window of `height` rows that
always contains `focusedId`, scrolling the window (not the focus) as focus nears
an edge; draw a dim `▴ N more` / `▾ N more` marker on the clipped side. The
down-marker can reuse `navGlyphs.expanded` (`▾`); the up-marker (`▴`) is **not**
in the palette today, so it would be a small glyph addition (or reuse
`navGlyphs.collapsed` `▸`). Window math keyed off `focusedId`, so no new state.

**Contract considerations.** This is the one request that touches *"no scroll"*
(`README.md:136`). Framing: a **keyboard-paged window is not mouse-scroll** —
there is no scrollbar, no wheel, no hover; focus is still character-based and
the window only moves because the keyboard moved focus. Recommend reading the
contract line as "no *mouse* scroll" and adding an explicit clause that
keyboard-driven windowing is sanctioned (it is arguably *required* to honour the
60×20 target). **Flagged in Open decision A.**

**Suggested tests.** `ink-testing-library`: rows ≫ height renders exactly
`height` rows; focused row always present in output; moving focus past the
window edge shifts the window by one; overflow markers appear/disappear at the
boundaries.

---

### R2 · Log / streaming viewport — `LogView` · **P1** · new primitive

**Generic problem.** A bounded region that shows the **tail** of an
ever-growing line stream — subprocess output, a build/CI log, a chat transcript.
The newest lines stay visible; older lines fall off the top. This is generic to
any app that runs a child process or streams text.

**Why a primitive.** There is no `Static`/`Log`/`Scrollable`/`Viewport` today.
`List` cannot tail (R1 windows around a *focused* row; a log has no focus, it
follows the bottom). Ink's own `<Static>` (a peer dep) is the opposite tool:
append-only **permanent scrollback** that grows past the screen — it is *not*
height-bounded, so it does not satisfy "a fixed region pinned to the newest
lines." A bottom-anchored, height-bounded, wrap-aware auto-tail is shared by
every streaming UI. It is presentational: `lines` in, window out.

**Current state.** Absent. Closest is `List` (no tail) and Ink `<Static>` (not
bounded, not re-exported/wrapped by blink).

**Proposed API:**

```ts
interface LogViewProps {
  /** The full line buffer; LogView shows the tail that fits `height`. */
  lines: string[];
  height: number;
  /** Follow the tail (default true). When false, hold the current window. */
  follow?: boolean;
  /** Wrap long lines (default) vs truncate. */
  wrap?: boolean;
}
```

Pairs naturally with `Spinner` (in progress) and a state glyph (done/failed) in
the surrounding `Pane`. The app owns the subprocess and feeds `lines`; `LogView`
only renders the tail.

**Contract considerations.** Two nuances. (1) Same "no scroll" point as R1 — an
auto-tailing window is not a scrollbar. (2) **Unlike R1**, the window advances
*without a keystroke* as new lines arrive. That is content re-rendering on new
data, but it brushes the contract's "nothing else moves" rule (`README.md:140`),
so it is a distinct question from R1 — surfaced in **Open decision A**.

**Suggested tests.** `lines.length > height` shows only the last `height`;
appending a line drops the oldest when following; `follow={false}` freezes the
window; wrap vs truncate output snapshots.

---

### R3 · Interactive selection — `Select` / `MultiSelect` **or** headless hooks · **P2** · see Open decision B

**Generic problem.** Pick one of N (radio); pick a subset of N (checklist),
optionally with a "choose at least k" rule. The single most common interactive
control in any TUI form. The visual layer already exists — `List` +
`selectedIds` + `checkboxOn/Off` glyphs (`glyphs.ts:26-27`) + `Input.error` —
but **no component owns** the Space-toggle, the selected `Set`, the "exactly
one" invariant, or the minimum-count guard. Every consumer hand-rolls the same
keystroke loop and state.

**The tension.** blink is presentational by contract; an interactive
`MultiSelect` that calls `useInput` internally would be the first key-owning
component in the library. That is a real philosophy decision, not a detail — so
this request is **deliberately two-headed**; the requirement is "stop making
every consumer hand-roll selection logic," and the call between these two shapes
(plus the recommendation) lives in **Open decision B**, the single source:

- **Option A — stateful widgets.** Ship `Select` / `MultiSelect` that own
  `useInput` + selection state and emit `onChange`. Most ergonomic for
  consumers; least consistent with "app owns keys."
- **Option B — headless hooks.** Ship `useListSelection({ rows,
  mode: 'single'|'multi', min? })` returning `{ focusedId, selectedIds, onKey }`,
  designed to feed the **existing** `List`. The app still renders and still owns
  the input wiring (`useInput(onKey)`), but the *logic* — toggle, single-select
  invariant, min-count, focus movement — lives in blink. This is the React
  "headless component" pattern (à la downshift / react-aria) and it keeps the
  presentational contract intact while killing the boilerplate.

Either way, **the form-level orchestration stays app-level** — which field is
focused, how values are collected, validation across fields, submit gating. Only
the per-control selection logic is the candidate for blink.

**Current state.** `List.tsx` (visual only), `CursorInput.tsx:30,44`
(presentational only).

**Suggested tests.** single-select keeps exactly one id; multi toggles on/off;
min-count blocks deselect below `min` and surfaces a flag the app can render as
`Input.error`.

> **Editable text input** (key-owning field with backspace + mid-string caret)
> is the same Option-A/B decision applied to `Input`: today `Cursor` only
> *trails* the value (`CursorInput.tsx:68`), so there is no real edit affordance.
> If you go headless, a `useTextInput()` hook complements `useListSelection`.

---

### R4 · Re-export `cellWidth` · **P2** · one-line change, high leverage

**Generic problem.** Any consumer building custom rows, aligning columns, or
truncating to fit needs to measure terminal cell width the **same way blink and
Ink do** — otherwise fixed-width cells drift and the grid misaligns (wide glyphs
like `⚠ ☑` are two cells; ascii fallbacks like `[x]` are three — the same
examples `textWidth.ts:10-12` uses). blink already
has the canonical function and uses it internally for `List` columns and `Footer`
chip-dropping — but it is **not exported** (`textWidth.ts:18`, absent from
`src/index.ts`).

**Why a primitive.** It is *the* width contract. Without it, consumers vendor
their own `string-width`, which (a) adds a dependency that can version-skew from
the one Ink/blink use and (b) duplicates the one measurement the whole grid
depends on. One line of export removes a whole class of alignment bugs.

**Proposed API:** add to `src/index.ts`:

```ts
export { cellWidth } from './textWidth.js';
```

**Suggested tests.** already covered by `List`/`Footer` behaviour; optionally a
direct unit test asserting wide-glyph (2) and ascii-fallback (3) widths.

---

### R5 · `Banner` / `Notice` — transient non-blocking message · **P3** · new primitive

**Generic problem.** A one-line, non-blocking status note in the content flow —
"auto-selected X because Y", "saved", "3 items skipped". Today blink has only the
**blocking** full-screen `Dialog` and the **persistent** bottom `Footer`; there
is no transient in-flow notice, and nothing with optional auto-dismiss.

**Why a primitive.** Generic to any app that needs to acknowledge a side effect
without stealing focus. Small and self-contained: one accent-tinted line, an
optional leading glyph, optional timed auto-dismiss. The copy-voice rule "state,
then action" (`README.md:147-148`) practically wants this surface.

**Proposed API:**

```ts
interface BannerProps {
  children: React.ReactNode;          // or `text: string`
  tone?: 'info' | 'warn' | 'success'; // intent only — maintainer picks the semantic tokens (e.g. accent / stateWarn / stateOk)
  glyph?: string;                     // resolved glyph, optional
  /** ms before auto-dismiss; omit = sticky (app controls mount). */
  dismissAfter?: number;
}
```

If auto-dismiss is added it uses a timer the app could also own — keep it
optional so `Banner` without `dismissAfter` is purely presentational.

**Suggested tests.** renders one line with the right token colour per tone;
glyph slot optional; (if timed) unmounts after `dismissAfter`.

---

### R6 · `Dialog` body accepts `ReactNode` · **P3** · change

**Generic problem.** `DialogProps` exposes only `lines?: string[]` for the body
(`Dialog.tsx:22`, already optional), so a dialog cannot host anything richer
than plain-text lines — not a `List`, not glyph-decorated rows, not a small
form. Any confirm step that wants to *show* structured content inside the modal
hits this wall.

**Why a primitive change.** Generic: dialogs hosting rich content is table
stakes. Today's workaround is to render the content in `Pane`s and put the
confirm on the `Footer` instead — which works, hence **P3**, but it forces the
modal pattern open for no real reason.

**Proposed API** (keep `lines` as a convenience; add `children`):

```ts
interface DialogProps {
  title: string;
  variant?: 'default' | 'error';
  lines?: string[];          // convenience for the common plain-text case
  children?: React.ReactNode; // rich body; wins over `lines` when both given
  actions?: DialogAction[];
  width?: number;
}
```

**Suggested tests.** `children` renders inside the frame; `lines` still works
unchanged; both-supplied prefers `children`.

---

### R7 · `ProgressBar` from the block ramp · **P3** · new primitive (optional)

**Generic problem.** Determinate progress (`k of n`, a percentage). Today only
the **indeterminate** `Spinner` ships; the block-shade ramp exists as raw glyph
data (`blocks`, `glyphs.ts:152-158`) but nothing assembles it into a bar.

**Why a primitive.** A char-cell progress bar is generic and the block ramp is
explicitly "the only gradient the contract allows" (`glyphs.ts:151`) — so the
material is already sanctioned, it just needs a component. Optional because many
apps are happy with `Spinner` + a `Footer` count.

**Proposed API:**

```ts
interface ProgressBarProps {
  value: number;   // 0..1
  width: number;   // cells
  color?: string;  // defaults to accent
}
```

**Suggested tests.** `value` maps to filled cells across `width`; clamps 0..1;
ascii icon-set degrades gracefully.

---

## 3 · non-requests — work the consumer owns (do **not** put in blink)

Listed so the agnostic boundary is explicit. None of this should ever land in
blink; it is composition or domain logic.

- **All keyboard dispatch + focus state machines** beyond what R3's optional
  hooks cover — global handlers (`?`, `q`), pane-switch (`Tab`), per-screen key
  routing. The app imports `useInput` from `ink` directly.
- **Form dispatchers and validation orchestration** — reading a config schema,
  switching on field type, collecting values, deciding "can the user submit."
  blink supplies per-field *display* (e.g. `Input.error`); the orchestration is
  the app's.
- **Any domain model** — dependency graphs, diff/delta computation, platform
  gating, data-flow between fields. Pure app logic.
- **Subprocess lifecycle + TTY/raw-mode coexistence** — spawning children, line
  buffering, exit codes, and handing `/dev/tty` to an interactive child while
  Ink holds raw-mode stdin. This is Node/Ink plumbing; blink should not touch
  `child_process` or stdin. (blink's job is to *render* the streamed lines — see
  R2.)
- **Responsive breakpoint logic** — `useStdoutDimensions()` gives the signal;
  the `if (columns < N)` layout switching, pane collapse/stacking, and `Dialog`
  width clamping are per-app conventions.
- **Domain glyph vocabulary** — the app calls `registerGlyphs()` at boot for any
  `{nerd,unicode,ascii}` icons beyond blink's built-ins, and owns any first-run
  font-probe UI that writes a user preference file (blink *reads* a preference
  but does not write one; `detectIconSet` does no probing).
- **Copy / wording** — the app writes the strings; blink only enforces the
  rendering rules.

---

## 4 · open design decisions (maintainer call)

These two are genuinely the maintainer's to make; the requests above are written
to work under either answer.

**A · Does "no scroll" forbid a keyboard-paged window?** (blocks R1, R2)
The contract says *"no mouse, no hover, no scroll"* (`README.md:136`) yet targets
a 60×20 fallback (`README.md:134`) that content will exceed. Recommendation:
read "no scroll" as "no *mouse* scroll / no scrollbar / no wheel," and add an
explicit clause that **keyboard-driven windowing** (focus moves, the window
follows) is sanctioned. If you disagree, R1/R2 don't happen and consumers clip —
but then the 60×20 promise is hard to keep for any non-trivial list.
**For R2 specifically:** also confirm that a `LogView` advancing its window as
new lines arrive (no keystroke) counts as content re-render, not "motion" under
the one-animation rule (`README.md:140`) — it is a distinct call from R1's
keyboard-driven case.

**B · May a component own `useInput`?** (shapes R3, editable input)
blink is presentational today — zero `useInput` in `src/`. Option A (stateful
widgets) is most ergonomic; Option B (headless hooks feeding the existing
presentational components) preserves the contract and is the recommendation. The
consumer is happy with either; it only needs the *selection logic* to stop being
hand-rolled per screen.

---

## priority summary

| # | Request | Kind | Priority | Unblocks |
|---|---|---|---|---|
| R1 | Windowed `List` (`height`) | change | **P1** | every long list; 60×20 target |
| R2 | `LogView` tailing viewport | new | **P1** | any streaming/subprocess UI |
| R3 | `Select`/`MultiSelect` **or** headless hooks | new/hook | **P2** | every interactive form |
| R4 | Re-export `cellWidth` | 1-line | **P2** | custom-row alignment |
| R5 | `Banner`/`Notice` | new | **P3** | transient non-blocking notices |
| R6 | `Dialog` accepts `ReactNode` | change | **P3** | rich modal content |
| R7 | `ProgressBar` | new | **P3** | determinate progress |

**Sequencing note for the consumer's benefit:** R1 and R2 share the same
windowing machinery and unblock the most screens — landing them first prevents
consumers from accreting throwaway offset math that the primitives later make
obsolete. R4 is a free win any time. R3 waits on Open decision B.

---

*Generated as design input. Read-only — implement nothing from this doc without
the maintainer's own design pass.*

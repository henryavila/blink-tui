# Request — a `path` form field kind

> **Status:** ✅ implemented in v0.2.0 — the pure design (Open decision P: blink
> stays no-I/O, the app feeds `preview` + `status`). See `src/components/Form.tsx`
> (`FieldKind` `'path'`, `FieldSpec.preview` / `.status`, `PathStatus`) and
> `test/form-progresslist.test.tsx` (`Form — path field`).
> **Audience:** whoever creates or changes blink primitives (the blink agent).
> **Prime directive:** the primitive proposed below **must stay generic and
> app-agnostic**. The consumer driving this request is one example, not the
> design target. If an API only makes sense for one app, it does not belong in
> blink — push it back to the consumer. Examples here are deliberately
> domain-neutral for that reason.
>
> Companion to `HANDOFF-component-requests.md` (R1–R7). This is a single focused
> request, framed in the same split: **primitive vs app-level.**

---

## who is asking, and why this exists

The consumer is the same **multi-screen, full-terminal configuration wizard**
described in `HANDOFF-component-requests.md` — keyboard-driven, runs over
`ssh`/`mosh`, targets 100×30 / 60×20 windows. It already builds its option
screens on blink's `<Form>` (`src/components/Form.tsx`) with the existing
`FieldKind` set.

Building the wizard surfaced a recurring control the form layer stops short of:
**a filesystem path field.** The consumer needs to ask the user for a directory
(in its case, a "dev root" where repos live, later exported into the shell), but
the same need is generic: an output directory, a config-file location, a clone
root, a log path, a socket path. Today the only tool is `kind: 'text'`, which
gives a bare string with no path affordances — no `~`/`$HOME` preview, no
"exists / will be created" feedback. Every consumer that asks for a path
re-derives the same two things: resolve-for-display and a status hint.

This doc is the consumer's side of the contract: *here is exactly what I need
from blink, framed generically, so you can decide what to build and what to hand
back to me as app-level work.*

---

## 1 · ground truth — what blink provides today

Confirmed against source so the request is precise, not vibes.

| Area | Today | Reference |
|---|---|---|
| Field kinds | `'text' \| 'secret' \| 'toggle' \| 'select' \| 'multiselect'` | `src/components/Form.tsx:23` |
| FieldSpec | `name · kind · label · required? · placeholder? · choices? · optionsFrom? · min? · max?` | `src/components/Form.tsx:37-58` |
| Text rendering | `text`/`secret` reuse `<Input>` — single-line, presentational, placeholder, error line, trailing `▎` cursor while focused | `src/components/CursorInput.tsx` |
| Validation | `validateForm()` checks `required` (any kind) + `multiselect` `min`; pure, drives `commit()` | `src/components/Form.tsx` (exported via `src/index.ts`) |
| Navigation | headless `useFormNavigation()` — app owns keys, calls `next/prev/toggle/setText/commit` | `src/components/Form.tsx` |

**Two framework-wide facts that shape this request (both already stated in the
companion doc, repeated because they decide the design):**

- **blink is 100% presentational.** `useInput` appears **nowhere** in `src/`. No
  component owns keystrokes; the app feeds `value` and owns the keys
  (`CursorInput.tsx`). A `path` field must obey this — it edits exactly like
  `text` (the app's existing `setText` loop), it does **not** introduce a
  key-owning widget.
- **blink does no I/O.** The non-requests in `HANDOFF-component-requests.md`
  explicitly keep `child_process` and `stdin` out of blink. **Filesystem access
  is the same class.** A `path` field therefore must **not** call `fs.stat`,
  `os.homedir()`, or any Node I/O to check existence or expand `~`. That single
  constraint is what makes this request mostly a *display + schema* change, and
  it drives **Open decision P** below.

---

## 2 · the request

### R-PATH · a `path` field kind · **P2** · change (additive)

**Generic problem.** Asking the user for a filesystem path inside a form. It
recurs across apps — a dev/work root, an output dir, a config-file location, a
clone target, a socket/log path. A bare `text` field accepts it but gives no
path-specific feedback: the user can't see what `~/code` resolves to, and can't
tell whether the path already exists or will be created. Every consumer that
asks for a path re-implements the same display affordances on top of `text`.

**Why a primitive, not app code.** It is a *kind of field* — the same category
as `text`/`secret`/`select`. The form layer (`Form` + `FieldSpec` +
`validateForm` + `useFormNavigation`) is exactly the blink surface that owns
"what controls a config screen can draw." Adding `path` there means every app
gets a consistent path control (label, required marker, focus fill, error line,
resolved-preview line, status glyph) instead of each one hand-rolling it. It is
additive: the four existing kinds are untouched.

**Why it stays inside the presentational + no-I/O contract.** The *editing* is
identical to `text` (app owns keys, `setText`). The *resolution* (`~`/`$HOME` →
absolute) and the *existence status* are **I/O / environment reads**, which blink
must not do. So the idiomatic design mirrors how `Input` already works: the app
computes the resolved preview and the status, and **feeds them in as props/values**,
exactly as it already feeds `value`. blink renders; the app supplies the facts.

**Current state.** `Form.tsx:23` (the kind union), `Form.tsx:37-58` (`FieldSpec`),
`CursorInput.tsx` (the text renderer a `path` field reuses), `validateForm()`
(where an optional format check would live).

**Proposed API** (all additive; omit everything new and a `path` field behaves
exactly like a labelled `text` field):

```ts
// Form.tsx
export type FieldKind = 'text' | 'secret' | 'toggle' | 'select' | 'multiselect'
                      | 'path';   // ← new

export interface FieldSpec {
  // ...existing fields unchanged...

  /**
   * For `kind: 'path'` — the resolved preview shown on a second, dim line under
   * the value (e.g. `→ /home/me/code`). The APP computes this (it owns
   * `os.homedir()` / env expansion); blink only renders it. Omit = no preview line.
   */
  preview?: string;

  /**
   * For `kind: 'path'` — a presentational status hint rendered as a state glyph
   * + tone next to the preview. The APP computes it (it owns `fs.stat`); blink
   * maps the name → glyph/colour via the existing state intents
   * (`stateGlyphs` / `stateIntents`). Suggested vocabulary:
   *   'exists'    → check  / stateOk     ("✓ exists")
   *   'create'    → warn   / stateWarn   ("✚ will be created")
   *   'invalid'   → cross  / stateErr    ("✗ not a directory")
   * Omit = no status slot.
   */
  status?: 'exists' | 'create' | 'invalid';
}
```

Note `preview`/`status` are deliberately **not** part of `FormValues` — they are
derived display facts the app recomputes as the user types (it already runs an
`onChange` per keystroke via `useFormNavigation`), so they live on the
re-passed `FieldSpec`, the same channel `choices` already uses.

**Rendering.** A `path` field renders the `Input` row exactly as `text` does
(value or placeholder, focus border, trailing cursor, error line), then — when
provided — a second dim line:

```
 ╭─ Dev root ────────────────────────────────────────────╮
 │  ~/code                                              ▎  │
 │  → /home/me/code   ✓ exists                            │
 ╰────────────────────────────────────────────────────────╯
```

The `→ <preview>` text is `fgDim`/`fgMuted`; the status glyph + its colour come
from the existing state intents (no new colour decisions, no new glyphs — `check`
/ `warn` / `cross` already exist in `stateGlyphs`).

**Validation.** `validateForm()` already enforces `required` for any kind, which
covers a required path. No path-format validation is proposed for blink (whether
a string is a "valid path" is OS- and intent-specific — that's app-level, fed
back through the existing `errors` map / `Input.error`).

**Contract considerations.**
- *Presentational:* yes. Editing reuses the `text` path entirely; no `useInput`,
  no new key ownership.
- *No I/O:* yes, **by construction** — blink never resolves `~` or stats the
  path; the app supplies `preview` and `status`. This is the deliberate design
  and the thing to sanity-check (Open decision P).
- *Intent, not style:* the consumer passes a `status` *name*; blink owns the
  glyph and the colour via `stateIntents`. The consumer never passes a glyph or
  a hue, consistent with the rest of the library.

**Suggested tests** (`ink-testing-library`, alongside `test/cursor-input.test.tsx`
/ `test/form-progresslist.test.tsx`):
- a `path` field with no `preview`/`status` renders identically to a `text`
  field (snapshot parity);
- `preview` renders the dim `→ …` line; absent = no second line;
- each `status` value renders the expected state glyph + tone (`exists`→ok,
  `create`→warn, `invalid`→err);
- `required` empty path still produces the standard required error;
- editing (`setText`) behaves exactly like `text` (Space is a literal char, not
  a toggle), via `useFormNavigation`.

---

## 3 · non-requests — work the consumer owns (do **not** put in blink)

Listed so the agnostic boundary is explicit.

- **All filesystem and environment I/O.** Resolving `~`/`$HOME`/`$VARS` to an
  absolute path, `fs.stat` to decide `exists` vs `create` vs `invalid`,
  permission checks, `mkdir`. The app computes these and feeds `preview` +
  `status`. blink must not import `fs`/`os`/`path` for this.
- **The default value and what the path *means*.** That a field defaults to
  `~/code`, that it is a "dev root", that it is later persisted to a per-host
  config file or exported into the shell — all app domain. blink sees a labelled
  field with a string value.
- **Path-format validation policy.** Whether a given string is acceptable on the
  target OS is app intent; surfaced through the existing `errors` map.
- **Key dispatch + focus.** Already app-owned via `useFormNavigation` + the app's
  `useInput`. Unchanged.
- **Optional directory-browser UX.** A full filesystem tree/picker is explicitly
  **out of scope** and not wanted here: for a well-defaulted single value it adds
  steps and hurts UX. If some app ever needs a browser, that is a separate
  primitive (and would lean on the windowed `List`, R1), not this field kind.

---

## 4 · open design decision (maintainer call)

**P · May blink resolve `~` and/or check existence itself?**
The request above keeps blink pure: the app feeds `preview` and `status`, blink
only renders them — mirroring "the app feeds `value` and owns the keys" and the
companion doc's "blink should not touch `child_process`/`stdin`." Filesystem and
`os.homedir()` reads are the same I/O class, so the recommendation is **stay
pure — app feeds preview + status.**

The alternative is that blink does light resolution/stat internally (more
ergonomic — the consumer passes only the raw value). That would make blink the
first component to do filesystem/environment I/O, which is a genuine contract
break, not a detail. The consumer is happy with the pure design and does **not**
ask for the I/O version; it is listed only so the maintainer makes the call
explicitly rather than by accident.

---

## priority summary

| # | Request | Kind | Priority | Unblocks |
|---|---|---|---|---|
| R-PATH | `path` field kind (`preview` + `status`, app-fed) | change (additive) | **P2** | any form that asks for a filesystem path |

**Sequencing note.** R-PATH is self-contained and additive — it does not depend
on R1–R7 in the companion doc. The only cross-reference is the explicit *no*: a
directory **browser** (if ever wanted) would be a separate primitive built on the
windowed `List` (R1), not part of this field kind.

---

*Generated as design input by the downstream consumer. Read-only — implement
nothing from this doc without the maintainer's own design pass.*

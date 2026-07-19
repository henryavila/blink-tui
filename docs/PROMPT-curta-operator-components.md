# Prompt — component pack for guided multi-phase operator CLIs

> **Audience:** blink-tui agent / maintainer (`@henryavila/blink-tui`).  
> **Status:** implementable request set. Nothing in this file is a visual design.  
> **Consumer example:** Curta’s guided operator path  
> (`curta <project-dir>` → preflight → prompts → analyze → compose → review handoff → render).  
> Curta is **one consumer**, not the design target.  
> **Prime directive:** generic, app-agnostic, **intent not style**.

---

## 0 · How to use this prompt

You are implementing **missing blink primitives** so apps can build a guided
operator CLI without inventing their own chrome.

1. Read this document end-to-end before coding.
2. Prefer **reuse** of existing primitives when they already cover the behaviour.
3. For each **new** primitive: implement behaviour + headless helpers if needed,
   presentational components only (app owns keys), tests, and a neutral demo
   entry in examples/docs.
4. **Do not** invent Curta-specific props (`edl`, `ffmpeg`, `review server`).
   Use domain-neutral names (`href`, `stages`, `choices`, `status`).
5. **Do not** accept raw colours, raw glyphs, border weights, or layout “skin”
   props from the consumer. The consumer expresses **intent** (`tone`, `state`,
   `kind`, labels, data). blink maps intent to appearance under house rules
   (those rules live in blink’s design system — not in this request).

### Non-goals for this pack

- No webviews, image previews, video thumbnails, or cut banks in the terminal.
- No second progress protocol: apps stream structured events; blink only
  **renders** state the app derived from those events.
- No Node requirement forced on the consumer’s plain mode — blink is optional
  chrome the app may mount when a TUI flag is on.
- No clipboard/open/browser implementation inside blink (app owns side effects).

---

## 1 · Operator journey (UX narrative)

A human runs a long, multi-phase job on a folder of media. The tool must:

1. **Orient** — show which product phase we are in (coarse pipeline).
2. **Ask only what theory cannot decide** — short sequential decisions
   (format, track, title/output), with smart defaults and a non-interactive path.
3. **Show live work** — during long stages, show phase + in-stage steps +
   optional percent + a tail of human log lines.
4. **Hand off to the outside world** — when the human must act in a browser
   (or another tool), surface the **primary action target** (URL), status, and
   suggested keys; wait without looking stuck.
5. **Resume cleanly** — after the external action, continue the pipeline without
   restarting from zero.

Plain terminal mode already prints events as lines. The TUI must express the
**same information architecture**, only with structured regions instead of a
wall of text.

---

## 2 · Ground truth — already in blink (reuse, do not reimplement)

Confirmed against current exports (`src/index.ts` / components). Compose these
first; only invent what they cannot express cleanly.

| Primitive | Behaviour already covered | Operator use |
|---|---|---|
| `ProgressList` | Ordered steps with `pending` / `running` / `ok` / `failed` / `waiting` / `skipped`; windowed height; active follow | In-stage task list (analyze shots, write EDL, …) |
| `ProgressBar` | Determinate or indeterminate progress for the **active** stage | Percent inside analyze/render |
| `LogView` | Tail of lines, follow newest, wrap/truncate | Human event stream (`msg` lines) |
| `Banner` | One-line non-blocking notice (`info` / `success` / `warn`) | “track auto-selected”, “stopped after compose” |
| `DescriptionList` | Label/value pairs | Host, port, title, format, path summary |
| `Footer` | Hotkey chips + right status slot | Global keys for the screen |
| `Header` | Top identity / title strip | App name + project short label |
| `Form` + `useFormNavigation` | Multi-field options (`text`, `secret`, `toggle`, `select`, `multiselect`, `path`) | Dense config screens (not the guided single-question flow) |
| `Dialog` | Blocking modal confirm / choose among actions | Destructive confirm, fatal error ack |
| `List` + window hooks | Navigable rows with focus/selection fed by app | File/candidate pickers when multi-select density is needed |
| `Pane` | Region framing / focus tone | Layout chrome |
| `Spinner` | Single sanctioned motion for “running” | Inside rails / lists, never a second competing animation |
| `Input` / `Cursor` | Presentational single-line field | Free-path entry when composed by a prompt |

**Implication:** long-run progress + log is **mostly already covered**. The gaps
are **coarse stage orientation**, **external handoff**, and **guided sequential
prompts** that feel like a dialogue, not a full options form.

---

## 3 · Component pack — what to create

Priority:

- **P0** — blocks a trustworthy review / external handoff screen.
- **P1** — blocks a calm multi-phase long run without app-specific chrome.
- **P2** — elevates guided prompts above ad-hoc `List`+`Input` composition.
- **P3** — polish / density; defer if timeboxed.

Each section: **intent → behaviour → UX contract → consumer responsibilities →
acceptance (behavioural)**. No colours, fonts, border styles, or glyph tables.

---

### C1 · `LinkPanel` — primary external action · **P0**

#### Intent

Present a **single primary destination** the human must use outside the
terminal (URL, deep link, local server, docs page), together with **status** and
**optional secondary facts**, so the eye always finds “what do I open?”

#### Behaviour

- Displays: short title (command voice), primary target string (`href` or
  equivalent label), status text or status intent, optional detail rows
  (label/value).
- Optional **hint chips** that *suggest* keys; does **not** bind keys.
- Purely presentational: no `useInput`, no clipboard, no `open`.
- Narrow terminals: primary target remains the dominant line; may truncate with
  a clear ellipsis affordance (behaviour: never wrap mid-token if avoidable).
- Wide terminals: show the full target when it fits.

#### UX

- This is the **focus of the handoff screen** — not a footnote.
- Status must read as: waiting / ready / failed / done (intent enum or free
  muted status line — pick one house rule and document it).
- Details answer “is this the right server?” (host, port, pid) without competing
  with the primary target.
- Works for OAuth, local dashboards, documentation jumps — not only “review”.

#### Consumer owns

- Generating the URL, starting/stopping servers, handling `o` / `c` / Enter.
- Mapping domain status to panel status intent.

#### Acceptance (behaviour)

1. Renders title + primary target + details from intent props only.
2. Does not throw on unknown status intent (degrades to neutral).
3. Does not capture keyboard.
4. Snapshot/demo uses domain-neutral copy (“dashboard ready”, not Curta jargon).

---

### C2 · `StageRail` — coarse pipeline orientation · **P1**

#### Intent

Show a **short ordered set of product phases** (≈3–8) and which phase is
pending, running, done, failed, or skipped. This is orientation for the whole
job, not the fine-grained step list.

#### Behaviour

- Input: array of `{ id, label, state }`.
- States align with the execution vocabulary already used by `ProgressList`
  (subset is fine: pending / running / ok / failed / skipped).
- Supports horizontal (default) and vertical orientations for different layouts.
- When width is insufficient: degrade by shortening labels, then glyphs-only,
  then overflow “+N more” — behaviour must remain understandable.
- Presentational only.

#### UX

- Always visible during long runs so the human knows “where we are” without
  reading the log.
- **One** phase is typically `running`; many may be `pending` or `ok`.
- Complements — does not replace — `ProgressList` (rail = phases, list = steps
  inside the active phase).

#### Consumer owns

- Mapping structured events → phase id/state (e.g. event prefix → stage).
- Labels (may be localized); ids stay stable machine keys if the app wants.

#### Acceptance (behaviour)

1. Mixed states render without consumer-supplied style props.
2. `running` may show motion only via the existing spinner contract when animate
   is allowed by the app/theme policy.
3. Vertical mode fits a side column without requiring mouse.
4. Docs explain relationship to `ProgressList` (see table in §4).

---

### C3 · `WaitGate` — indefinite human wait · **P0**

#### Intent

Express “we are **blocked on a human action that may take minutes**” without
looking crashed or still “running work”. Distinct from a short spinner step.

#### Behaviour

- Shows: what we are waiting for (short title), optional primary target
  (may embed or sit above `LinkPanel`), elapsed wait time (optional, app-fed
  or internal clock — prefer app-fed for testability), and status intent
  (`waiting` / `ready` / `failed`).
- May compose `LinkPanel` + banner-like notice + footer hints rather than
  inventing a second URL surface — if so, document the composition pattern as
  the canonical “handoff screen”.
- If implemented as a single primitive, it must not start work timers that
  compete with `Spinner` elsewhere (one motion budget).

#### UX

- Human must feel **safe to leave the terminal**, do work in the browser, and
  return.
- Clear difference between:
  - **running** (machine is busy),
  - **waiting** (machine is idle on purpose),
  - **ready** (human can continue).
- Suggested continue key is visible; actual continue is app-owned.

#### Consumer owns

- Detecting when the external action is complete (poll, file watch, user key).
- Timeout policy and failure messaging.

#### Acceptance (behaviour)

1. `waiting` vs `running` are distinguishable by state intent alone.
2. No auto-continue without app signal.
3. Works with or without an `href` (wait can be “insert device”, not only URL).

---

### C4 · `GuidedPrompt` — single sequential decision · **P2**

#### Intent

One **question at a time** with a default, optional choices, and optional free
text — the dialogue pattern for guided flows. Not a full multi-field `Form`.

#### Behaviour

- Props (intent): `question`, `defaultValue?`, `choices?` (id+label),
  `allowFreeText?`, `value` (controlled), `error?`, `busy?`.
- Renders the question, the current value/default, and the choice list when
  present (numbered or selectable — selection state is app-fed).
- Free-text mode reuses presentational `Input`.
- Headless helper optional: `useGuidedPromptNavigation` for next/prev choice /
  confirm — **keys still owned by the app**.
- Non-interactive / assume-yes is **app-level** (do not hardcode `-y` here);
  the component must still render a stable “resolved answer” state for logging.

#### UX

- Defaults are obvious; Enter accepts default without ceremony.
- Multi-candidate pick: human can choose by index or by moving focus.
- Zero candidates: free path or explicit “none” must be expressible.
- Errors are inline and non-modal unless the app escalates to `Dialog`.

#### Consumer owns

- Prompt order, validation, filesystem checks, i18n strings.
- Mapping answers into the pipeline.

#### Acceptance (behaviour)

1. Controlled value: re-render with new `value` does not fight user-owned state.
2. Works with only default (no choices), only choices, or both.
3. Does not implement domain precedence (e.g. audio resolution) — pure UI state.

---

### C5 · `ChoicePicker` — dense multi-candidate pick · **P2**

#### Intent

When many candidates share one decision (tracks, profiles, hosts), show a
**navigable list of options** with one focused row and optional secondary meta
(duration, size, path tail).

#### Behaviour

- Prefer extending / composing `List` + `useListWindow` + `useListNavigation`
  rather than a parallel list engine.
- If a thin wrapper ships: it only standardizes “picker” semantics (single
  select, confirm key is external, empty state message).
- Empty state: explicit message intent (“no candidates”) + optional free-text
  affordance pointer (the app may switch to `GuidedPrompt` free-text).

#### UX

- Focus moves with keyboard; window follows focus.
- Meta column is secondary; label is primary.
- Confirm is not implicit on focus change.

#### Consumer owns

- Building candidate lists and resolving selection to a path/id.

#### Acceptance (behaviour)

1. Empty, one, and many candidates are all legible.
2. Windowing works when candidates exceed height.
3. No domain-specific sorting baked in (app sorts before pass-in).

---

### C6 · `RunSummary` — end-of-stage facts · **P2**

#### Intent

After a stage completes (or stops at a boundary), show a **compact summary of
outcomes** the human may need before the next phase (artifact paths, counts,
duration, warnings count) — not a log dump.

#### Behaviour

- Input: title + list of facts (label/value) + optional tone
  (`success` / `warn` / `info`) + optional next-step line.
- Composition candidate: `Banner` + `DescriptionList` + short next-step text.
  Ship a dedicated primitive only if composition diverges across apps; otherwise
  document a **canonical composition recipe** in docs and skip a new component.

#### UX

- Scannable in under two seconds.
- Distinguishes “success with warnings” from hard failure (failure still uses
  `Dialog` or error `Banner` + stop).

#### Consumer owns

- Which facts matter; localization of labels.

#### Acceptance (behaviour)

1. Recipe or primitive documented with a neutral example
   (“build stopped after step 2 · artifacts …”).
2. No requirement for images or previews.

---

### C7 · `MetricStrip` — live counters · **P3**

#### Intent

A single row of **live metrics** during a run (items done/total, elapsed,
throughput) that does not consume a full `DescriptionList` block.

#### Behaviour

- Input: ordered metrics `{ id, label, value }`; values are preformatted strings
  (app formats numbers/locales).
- Drops trailing metrics when width is insufficient (whole-metric drop, not
  character soup).
- Presentational; updates are just prop changes.

#### UX

- Secondary to StageRail and ProgressList; never the only status channel.
- Stable order so the eye can track one metric across frames.

#### Acceptance (behaviour)

1. Narrow width drops metrics greedily and predictably.
2. Empty metric list renders nothing (no empty chrome).

---

### C8 · `KeyHints` — local hint cluster · **P3**

#### Intent

Show a **local** set of key hints near a panel (handoff, dialog-adjacent) without
replacing the global `Footer`.

#### Behaviour

- Input: `{ key, description }[]` — same mental model as Footer chips.
- Does not bind keys; pure display.
- When both Footer and KeyHints show the same key, app should de-dupe; blink
  may document “Footer is global authority”.

#### UX

- Use for **contextual** actions on the focused panel; Footer remains global.

#### Acceptance (behaviour)

1. Renders zero hints without extra padding noise.
2. Shares visual language with Footer without importing app themes.

---

## 4 · How pieces compose (reference screens)

These are **behavioural wireframes**, not layouts.

### Screen A — long run

- `Header` — app + project label  
- `StageRail` — preflight → analyze → compose → review → render  
- `ProgressList` — steps of the active stage  
- `ProgressBar` — optional in-stage %  
- `LogView` — tail of human lines  
- `Footer` — quit / toggle log / cancel  
- optional `MetricStrip`

### Screen B — guided decision

- `Header`  
- `StageRail` (current phase = prompts / setup)  
- `GuidedPrompt` or `ChoicePicker`  
- `Footer` — confirm / back / quit  

### Screen C — external handoff + wait

- `Header`  
- `StageRail` (review = waiting)  
- `LinkPanel` (primary URL)  
- `WaitGate` status (or LinkPanel tone = waiting)  
- `DescriptionList` optional facts  
- `Footer` / `KeyHints` — open · copy · continue · quit  

### Screen D — boundary summary

- `RunSummary` (or Banner + DescriptionList)  
- `Footer` — continue · open artifacts path (app) · quit  

---

## 5 · Explicitly NOT for blink (consumer / Curta owns)

| Concern | Why not blink |
|---|---|
| Mapping `core.log` events → stage/progress models | Domain event schema |
| `resolve_audio` precedence, EDL paths, render | Domain pipeline |
| Starting review server, opening browser, clipboard | Side effects / OS |
| i18n catalogs for prompt strings | App localization |
| Plain mode without Node | Product requirement |
| Cut previews, timeline, bank UI | Belongs in web review, not TUI |
| Packaging / installers | Out of scope |

---

## 6 · Implementation order (suggested)

1. **C1 LinkPanel** + handoff composition docs (unblocks external wait UX).  
2. **C3 WaitGate** (or documented composition of C1 + Banner + Footer).  
3. **C2 StageRail**.  
4. **C4 GuidedPrompt** + **C5 ChoicePicker** (or List recipes).  
5. **C6 RunSummary** recipe vs primitive decision.  
6. **C7 / C8** if capacity remains.

Until each lands, consumers compose existing primitives (see §2) and keep
behaviour identical so enabling `--tui` is progressive enhancement.

---

## 7 · Cross-cutting contracts (non-visual)

1. **Presentational by default** — no `useInput` inside new components unless an
   existing blink exception is deliberately expanded (prefer headless hooks).
2. **App owns keys, focus, selection, side effects.**
3. **One animation budget** — only the sanctioned spinner family for “running”.
4. **Ascii / unicode / nerd** — all glyphs via existing glyph registry; unknown
   names never crash.
5. **Targets** — usable at 100×30 and 60×20; keyboard only.
6. **Tests** — behaviour + degradation (narrow width, empty data, unknown
   tone/state); neutral snapshots for docs.
7. **API language** — English identifiers; no consumer domain words in prop names.

---

## 8 · Acceptance for the pack as a whole

The pack is done when a domain-neutral demo app can show:

1. A five-phase rail advancing while a ProgressList runs steps and LogView tails
   lines.  
2. A handoff screen whose primary affordance is a URL, with waiting status and
   key hints, without the demo implementing clipboard/open.  
3. A one-question guided prompt with default accept and a multi-candidate pick.  
4. All of the above without the demo passing colours or glyphs into blink.

---

## 9 · Provenance

- Curta plan `cli-funcional` F3 (optional blink TUI shell) and F0/F1 operator path.  
- Prior sketch prompts (may still exist under Curta’s plan tree): LinkPanel,
  StageRail — this document **supersedes** them as the complete pack brief.  
- blink house rules: root `README.md`, `design-reference/`, presentational
  contract in existing component JSDoc.

---

## 10 · Reply shape when implementing

For each component you ship, report:

- name + path  
- intent in one sentence  
- props (intent only)  
- what you reused vs invented  
- tests added  
- what remains composition-only (if deferred)

Do **not** report colour tokens, border styles, or pixel/column “look”
decisions unless a behaviour depends on them (e.g. truncation rules).

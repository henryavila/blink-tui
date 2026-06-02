# Component requests from the mesh setup wizard (2026-06-02)

> Current design input (supersedes the historical `HANDOFF-component-requests.md`
> for these items). Audience: whoever changes blink primitives. Prime directive
> unchanged — every primitive must stay **generic and app-agnostic**; the mesh
> wizard is one example, not the design target.
>
> Surfaced while adding a badge legend to the wizard's bundle picker. Neither is
> a bug — both are limitations that force the BLINK-ONLY consumer into a
> compromise.

| # | Request | Kind | Priority |
|---|---|---|---|
| L1 | `Legend` / `GlyphKey` — multi-color key row | new | P2 |
| L2 | `Banner` plain tone (suppress the leading tone glyph) | change | P3 |

## L1 — `Legend` / `GlyphKey` (multi-color key)

The wizard's bundle rows carry three glyph columns (selection
`checkboxOn/Off/Lock`, install-state `check/half/cross`, domain icon). Users
couldn't read them, so we added a legend. To match the rows it should show each
glyph in **its own token color** — `✓` green, `✗` red, `■` accent — exactly like
the List renders them via `stateIntents` / `selectionIntents`.

A consumer can't do this today: per-glyph color needs raw `<Text color>` spans,
which the BLINK-ONLY rule forbids (Box for layout, color via tokens, no custom
text). The current legend therefore falls back to a single-tone `Banner`
(monochrome).

**Proposal:** a primitive that renders a horizontal key of `glyph + label` pairs,
each glyph in its token color, set-aware via `useGlyph`:

```tsx
<Legend items={[
  { glyph: 'checkboxOn', token: 'accent',   label: 'selected' },
  { glyph: 'check',      token: 'stateOk',  label: 'installed' },
  { glyph: 'cross',      token: 'stateErr', label: 'missing' },
]} />
```

Because `stateIntents`/`selectionIntents` already pair a glyph name with a token,
a consumer could build the items straight from those maps. Generic: any app with
status/selection glyphs wants this.

## L2 — `Banner` plain tone (suppress leading glyph)

`Banner` always prepends `g(tone.glyph)` (renders as e.g. `↳ `). For a permanent
legend/status line meant to read as neutral info, there's no way to drop it.

**Proposal:** `tone="plain"` (no leading glyph, neutral `fgMuted`) or an
`icon={false}` prop. Pairs with L1 — a legend bar shouldn't carry a tone marker.

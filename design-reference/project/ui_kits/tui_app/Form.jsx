// Form.jsx — a vertical set of LABELLED fields, each a control of a known
// kind, navigated by keyboard and validated by declared constraints. This is
// the universal "options / config screen" primitive (git config, tokens,
// versions, flags). Without it, every app re-derives checkbox / radio / toggle
// from the raw SELECTION glyphs — exactly the divergence blink exists to avoid.
//
// INTENT, NOT STYLE: a field declares its `kind`; blink owns the glyph, the
// colour, the focus fill, the required marker, and the error line. The consumer
// never passes a glyph or a colour.
//
//   blink owns ............. ☑ / ☐ / ▣ (via SELECTION) + colours · the ▎ cursor
//                            (via Input) · the focus fill (--bg-focused) on the
//                            focused control · the required marker (* in
//                            --state-warn) · the error line (✗ in --state-err +
//                            --fg-muted text) · the three text tiers (label
//                            --fg · selected value --fg · unselected --fg-muted).
//
// FieldSpec: { name, kind, label, required?, placeholder?, choices?, min?, max?, optionsFrom? }
//   kind        text | secret | toggle | select | multiselect  (the ONLY look prop)
//   choices     [{ id, label? }] | [string]   (select / multiselect)
//   optionsFrom another field NAME — choices derive from that field's value
//               (e.g. "Default version" from the marked "PHP versions")
//   min / max   multiselect bounds (blink refuses to cross them)
//
// text / secret REUSE the existing Input (cursor, placeholder, error, focus
// border). secret masks its value to bullets and shows a reveal hint when
// focused. Form is the layer that was missing above Input.

// resolveChoices(field, values) → [{ id, label }]
// optionsFrom resolves the choices of a select/multiselect from another field's
// current value (its selected ids); otherwise normalises the field's own choices.
function resolveChoices(field, values) {
  values = values || {};
  if (field.optionsFrom) {
    const src = values[field.optionsFrom];
    const ids = Array.isArray(src) ? src : src != null && src !== "" ? [src] : [];
    return ids.map((id) => ({ id, label: String(id) }));
  }
  return (field.choices || []).map((c) =>
    typeof c === "string"
      ? { id: c, label: c }
      : { id: c.id, label: c.label != null ? c.label : String(c.id) });
}

// buildStops(fields, values) → ordered focus stops. text/secret/toggle = one
// stop (id = name); select/multiselect = one stop PER choice (id = name::choiceId)
// so nav moves linearly choice → choice → next field, exactly as specified.
function buildStops(fields, values) {
  const stops = [];
  for (const f of fields) {
    if (f.kind === "select" || f.kind === "multiselect") {
      for (const c of resolveChoices(f, values)) {
        stops.push({ id: f.name + "::" + c.id, name: f.name, kind: f.kind, choiceId: c.id });
      }
    } else {
      stops.push({ id: f.name, name: f.name, kind: f.kind, choiceId: null });
    }
  }
  return stops;
}

// validate(fields, values) → { ok, errors }. required (text/secret/toggle/any)
// and multiselect `min`. Pure — used by commit() and renderable directly.
function validateForm(fields, values) {
  values = values || {};
  const errors = {};
  for (const f of fields) {
    const v = values[f.name];
    const empty =
      v == null || v === "" || (Array.isArray(v) && v.length === 0);
    if (f.required && empty) errors[f.name] = "required";
    if (f.kind === "multiselect" && f.min != null) {
      const n = Array.isArray(v) ? v.length : 0;
      if (n < f.min) errors[f.name] = "select at least " + f.min;
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

// ── headless navigation hook — the app owns the keys; it calls these intents ──
// The app wires keystrokes to next/prev/toggle/setText; NO Form component reads
// a key (same as the rest of blink). `onChange(nextValues)` applies value edits.
//   nav.focusId               current focus stop id
//   nav.next() / nav.prev()   move between controls (linear)
//   nav.focusField(name)      jump focus to a field
//   nav.toggle()              ␣ on the focused control (toggle / choice)
//   nav.setText(name, str)    edit a text / secret field
//   nav.commit() → { ok, errors }
function useFormNavigation({ fields, values, onChange }) {
  const stops = buildStops(fields, values || {});
  const [idx, setIdx] = React.useState(0);
  const safe = Math.min(idx, Math.max(0, stops.length - 1));
  const stop = stops[safe] || null;
  const emit = (next) => { if (typeof onChange === "function") onChange(next); };

  return {
    focusId: stop ? stop.id : null,
    focusStop: stop,
    stops,
    next: () => setIdx((i) => Math.min(i + 1, stops.length - 1)),
    prev: () => setIdx((i) => Math.max(i - 1, 0)),
    focusField: (name) => {
      const j = stops.findIndex((s) => s.name === name);
      if (j >= 0) setIdx(j);
    },
    toggle: () => {
      if (!stop) return;
      const f = fields.find((ff) => ff.name === stop.name);
      if (!f) return;
      const v = (values || {})[f.name];
      if (f.kind === "toggle") emit({ ...values, [f.name]: !v });
      else if (f.kind === "select") emit({ ...values, [f.name]: stop.choiceId });
      else if (f.kind === "multiselect") {
        const cur = Array.isArray(v) ? v : [];
        const has = cur.includes(stop.choiceId);
        if (has) {
          if (f.min != null && cur.length <= f.min) return;        // refuse < min
          emit({ ...values, [f.name]: cur.filter((x) => x !== stop.choiceId) });
        } else {
          if (f.max != null && cur.length >= f.max) return;        // refuse > max
          emit({ ...values, [f.name]: cur.concat(stop.choiceId) });
        }
      }
    },
    setText: (name, str) => emit({ ...values, [name]: str }),
    commit: () => validateForm(fields, values || {}),
  };
}

// ── presentation ──────────────────────────────────────────────────────────

function FieldLabel({ label, required }) {
  return (
    <div style={{ whiteSpace: "pre", lineHeight: "var(--cell-h)", color: "var(--fg)" }}>
      {label}
      {required ? <span style={{ color: "var(--state-warn)" }}>{" *"}</span> : null}
    </div>
  );
}

// A single choice token: SELECTION glyph + label. selected → --fg, unselected →
// --fg-muted. The focused choice carries the --bg-focused fill.
function Choice({ selected, locked, label, focused }) {
  const sel = locked ? SELECTION.locked : selected ? SELECTION.selected : SELECTION.unselected;
  return (
    <span style={{
      display: "inline-flex", alignItems: "baseline", gap: "1ch",
      whiteSpace: "pre", padding: "0 1ch",
      background: focused ? "var(--bg-focused)" : "transparent",
    }}>
      <span style={{ color: sel.color }}>{sel.glyph}</span>
      <span style={{ color: selected || locked ? "var(--fg)" : "var(--fg-muted)" }}>{label}</span>
    </span>
  );
}

function ErrorLine({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ whiteSpace: "pre", paddingLeft: "1ch" }}>
      <span style={{ color: "var(--state-err)" }}>{STATE.cross}</span>{" "}
      <span style={{ color: "var(--fg-muted)" }}>{msg}</span>
    </div>
  );
}

function FieldControl({ field, value, values, focusStop, error }) {
  const focusedHere = !!focusStop && focusStop.name === field.name;

  if (field.kind === "text" || field.kind === "secret") {
    const isSecret = field.kind === "secret";
    const str = value == null ? "" : String(value);
    const display = isSecret ? "•".repeat(str.length) : str;
    // text/secret reuse Input: its rounded box, ▎ cursor, placeholder + error.
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Input value={display} placeholder={field.placeholder || ""} focused={focusedHere} error={error} />
        {isSecret && focusedHere ? (
          <div style={{ whiteSpace: "pre", paddingLeft: "1ch", color: "var(--fg-faint)" }}>
            ␣ reveal
          </div>
        ) : null}
      </div>
    );
  }

  if (field.kind === "toggle") {
    const on = !!value;
    return (
      <div style={{ display: "flex" }}>
        <Choice selected={on} label={on ? "enabled" : "disabled"} focused={focusedHere} />
      </div>
    );
  }

  // select / multiselect — inline SELECTION tokens, one focus stop per choice.
  const choices = resolveChoices(field, values);
  const selectedSet =
    field.kind === "multiselect"
      ? new Set(Array.isArray(value) ? value : [])
      : new Set(value != null && value !== "" ? [value] : []);
  if (choices.length === 0) {
    return <div style={{ color: "var(--fg-dim)", whiteSpace: "pre", paddingLeft: "1ch" }}>—</div>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", rowGap: "2px", columnGap: "1ch" }}>
      {choices.map((c) => (
        <Choice key={c.id}
          selected={selectedSet.has(c.id)}
          label={c.label}
          focused={!!focusStop && focusStop.name === field.name && focusStop.choiceId === c.id} />
      ))}
    </div>
  );
}

// Form — render-only. fields + values + focusId (+ errors) in; glyphs, colours,
// focus fill, required markers and error lines out. Reads no keys.
function Form({ fields, values = {}, focusId, errors = {} }) {
  const stops = buildStops(fields, values);
  const focusStop = stops.find((s) => s.id === focusId) || null;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {fields.map((f) => {
        const textual = f.kind === "text" || f.kind === "secret";
        return (
          <div key={f.name} style={{ display: "flex", flexDirection: "column", marginBottom: "var(--cell-h)" }}>
            <FieldLabel label={f.label} required={f.required} />
            <FieldControl field={f} value={values[f.name]} values={values} focusStop={focusStop} error={errors[f.name]} />
            {textual ? null : <ErrorLine msg={errors[f.name]} />}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  Form, useFormNavigation,
  resolveChoices, buildStops, validateForm,
  FieldLabel, Choice, ErrorLine, FieldControl,
});

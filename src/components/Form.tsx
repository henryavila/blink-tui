import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { selectionIntents } from '../glyphs/glyphs.js';
import { cellWidth } from '../textWidth.js';
import { Input } from './CursorInput.js';

/**
 * Form — a vertical set of LABELLED fields, each a control of a known `kind`,
 * navigated by keyboard and validated by declared constraints. The universal
 * "options / config screen" primitive (git config, tokens, versions, flags).
 * Without it every app re-derives checkbox / radio / toggle from the raw
 * SELECTION glyphs — exactly the divergence blink exists to avoid.
 *
 * INTENT, NOT STYLE: a field declares its `kind`; blink owns the glyph, the
 * colour, the focus fill, the required marker, and the error line. The consumer
 * never passes a glyph or a colour. `text` / `secret` reuse {@link Input} (the
 * `▎` cursor, placeholder, error, focus border); Form is the layer above it.
 */

/** The control a field renders — the ONLY look prop. */
export type FieldKind = 'text' | 'secret' | 'toggle' | 'select' | 'multiselect';

/** A choice for a `select` / `multiselect` — a bare id, or an id with a label. */
export type ChoiceInput = string | { id: string; label?: string };

/** A resolved choice (id + display label). */
export interface ResolvedChoice {
  id: string;
  label: string;
}

/** One field in a {@link Form}. */
export interface FieldSpec {
  /** Stable key into the values object. */
  name: string;
  /** Which control to draw — the only look prop. */
  kind: FieldKind;
  /** The label above the control. */
  label: string;
  /** Required → a warn `*` marker and an empty-value error. */
  required?: boolean;
  /** Placeholder for `text` / `secret`, shown while empty. */
  placeholder?: string;
  /** Choices for `select` / `multiselect`. */
  choices?: ChoiceInput[];
  /** Derive choices from another field's current value (its selected ids). */
  optionsFrom?: string;
  /** `multiselect` lower bound — Form refuses to deselect below it. */
  min?: number;
  /** `multiselect` upper bound — Form refuses to select above it. */
  max?: number;
}

/** A single field's value: a string (text/secret/select), a set of ids (multiselect), or a flag (toggle). */
export type FieldValue = string | string[] | boolean | undefined;

/** The form's value map, keyed by field name. */
export type FormValues = Record<string, FieldValue>;

/** Validation result — `ok` plus a per-field message map. */
export interface FormValidation {
  ok: boolean;
  errors: Record<string, string>;
}

/** A keyboard focus stop. text/secret/toggle = one per field; select/multiselect = one per choice. */
export interface FocusStop {
  /** `name` for single-stop fields, `name::choiceId` for choice fields. */
  id: string;
  name: string;
  kind: FieldKind;
  choiceId: string | null;
}

/**
 * `optionsFrom` resolves the choices of a select/multiselect from another
 * field's current value (its selected ids); otherwise normalises the field's
 * own `choices` to `{ id, label }`.
 */
export function resolveChoices(field: FieldSpec, values: FormValues = {}): ResolvedChoice[] {
  if (field.optionsFrom) {
    const src = values[field.optionsFrom];
    const ids = Array.isArray(src) ? src : src != null && src !== '' ? [String(src)] : [];
    return ids.map((id) => ({ id: String(id), label: String(id) }));
  }
  return (field.choices ?? []).map((c) =>
    typeof c === 'string'
      ? { id: c, label: c }
      : { id: c.id, label: c.label != null ? c.label : String(c.id) },
  );
}

/**
 * Ordered focus stops. text/secret/toggle yield one stop (`id = name`);
 * select/multiselect yield one stop PER choice (`id = name::choiceId`), so nav
 * moves linearly choice → choice → next field.
 */
export function buildStops(fields: FieldSpec[], values: FormValues = {}): FocusStop[] {
  const stops: FocusStop[] = [];
  for (const f of fields) {
    if (f.kind === 'select' || f.kind === 'multiselect') {
      for (const c of resolveChoices(f, values)) {
        stops.push({ id: `${f.name}::${c.id}`, name: f.name, kind: f.kind, choiceId: c.id });
      }
    } else {
      stops.push({ id: f.name, name: f.name, kind: f.kind, choiceId: null });
    }
  }
  return stops;
}

/** True when a value is "empty" for required-checking (null / '' / []). */
function isEmpty(v: FieldValue): boolean {
  return v == null || v === '' || (Array.isArray(v) && v.length === 0);
}

/**
 * Validate `required` (any kind) and `multiselect` `min`. Pure — used by
 * {@link useFormNavigation}'s `commit()` and renderable directly into a {@link Form}.
 */
export function validateForm(fields: FieldSpec[], values: FormValues = {}): FormValidation {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.required && isEmpty(v)) errors[f.name] = 'required';
    if (f.kind === 'multiselect' && f.min != null) {
      const n = Array.isArray(v) ? v.length : 0;
      if (n < f.min) errors[f.name] = `select at least ${f.min}`;
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/** What {@link useFormNavigation} returns — the intents the app wires keys to. */
export interface FormNavigation {
  /** Current focus-stop id (`name` or `name::choiceId`), or null when empty. */
  focusId: string | null;
  /** The current focus stop. */
  focusStop: FocusStop | null;
  /** All stops, in order. */
  stops: FocusStop[];
  /** Move to the next / previous control (linear). */
  next: () => void;
  prev: () => void;
  /** Jump focus to a field by name. */
  focusField: (name: string) => void;
  /** `␣` on the focused control — toggles a flag / selects a choice (honouring min/max). */
  toggle: () => void;
  /** Edit a `text` / `secret` field's value. */
  setText: (name: string, str: string) => void;
  /** Validate the current values. */
  commit: () => FormValidation;
}

/**
 * Headless navigation for a {@link Form} — the app owns the keys and calls these
 * intents; NO Form component reads a key (the rest of blink works the same way).
 * `onChange(nextValues)` receives every value edit.
 *
 * ```tsx
 * const nav = useFormNavigation({ fields, values, onChange: setValues });
 * useInput((input, key) => {
 *   if (key.downArrow) nav.next();
 *   else if (key.upArrow) nav.prev();
 *   else if (input === ' ') nav.toggle();
 * });
 * return <Form fields={fields} values={values} focusId={nav.focusId} errors={errors} />;
 * ```
 */
export function useFormNavigation({
  fields,
  values = {},
  onChange,
}: {
  fields: FieldSpec[];
  values?: FormValues;
  onChange?: (next: FormValues) => void;
}): FormNavigation {
  const stops = buildStops(fields, values);
  const [idx, setIdx] = useState(0);
  const safe = Math.min(idx, Math.max(0, stops.length - 1));
  const stop = stops[safe] ?? null;
  const emit = (next: FormValues): void => onChange?.(next);

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
      const v = values[f.name];
      if (f.kind === 'toggle') emit({ ...values, [f.name]: !v });
      else if (f.kind === 'select') emit({ ...values, [f.name]: stop.choiceId ?? '' });
      else if (f.kind === 'multiselect') {
        const cur = Array.isArray(v) ? v : [];
        const id = stop.choiceId ?? '';
        if (cur.includes(id)) {
          if (f.min != null && cur.length <= f.min) return; // refuse < min
          emit({ ...values, [f.name]: cur.filter((x) => x !== id) });
        } else {
          if (f.max != null && cur.length >= f.max) return; // refuse > max
          emit({ ...values, [f.name]: cur.concat(id) });
        }
      }
    },
    setText: (name, str) => emit({ ...values, [name]: str }),
    commit: () => validateForm(fields, values),
  };
}

// ── presentation ──────────────────────────────────────────────────────────

/** The label above a control; required fields trail a warn `*`. */
function FieldLabel({ label, required }: { label: string; required?: boolean }): React.ReactElement {
  const tokens = useTokens();
  return (
    <Box flexDirection="row">
      <Text color={tokens.fg}>{label}</Text>
      {required ? <Text color={tokens.stateWarn}>{' *'}</Text> : null}
    </Box>
  );
}

/**
 * A single choice token: a SELECTION glyph + label. Selected → `fg`,
 * unselected → `fgMuted`; the focused choice carries the `bgFocused` fill. The
 * glyph cell is a fixed 2 cells (the `☑` width) so the label start never jitters
 * between `☑` / `☐` / `▣`.
 */
function Choice({
  selected,
  locked,
  label,
  focused,
}: {
  selected?: boolean;
  locked?: boolean;
  label: string;
  focused?: boolean;
}): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();
  const sel = locked ? selectionIntents.locked : selected ? selectionIntents.selected : selectionIntents.unselected;
  const bg = focused ? tokens.bgFocused : undefined;
  const glyphStr = g(sel.glyph);
  const labelColor = selected || locked ? tokens.fg : tokens.fgMuted;
  const pad = glyphStr + ' '.repeat(Math.max(0, 2 - cellWidth(glyphStr)));
  return (
    <Box flexDirection="row" marginRight={1}>
      <Text backgroundColor={bg}> </Text>
      <Text color={tokens[sel.token]} backgroundColor={bg} wrap="truncate">{pad}</Text>
      <Text backgroundColor={bg}> </Text>
      <Text color={labelColor} backgroundColor={bg} wrap="truncate">{label}</Text>
      <Text backgroundColor={bg}> </Text>
    </Box>
  );
}

/** The `✗ message` line below a non-textual field (text/secret get Input's own). */
function ErrorLine({ msg }: { msg?: string }): React.ReactElement | null {
  const tokens = useTokens();
  const g = useGlyph();
  if (!msg) return null;
  return (
    <Box flexDirection="row" paddingLeft={1}>
      <Text color={tokens.stateErr}>{g('cross')}</Text>
      <Text color={tokens.fgMuted}>{' ' + msg}</Text>
    </Box>
  );
}

/** The control for one field — resolved from its `kind`. */
function FieldControl({
  field,
  value,
  values,
  focusStop,
  error,
}: {
  field: FieldSpec;
  value: FieldValue;
  values: FormValues;
  focusStop: FocusStop | null;
  error?: string;
}): React.ReactElement {
  const tokens = useTokens();
  const focusedHere = !!focusStop && focusStop.name === field.name;

  if (field.kind === 'text' || field.kind === 'secret') {
    const isSecret = field.kind === 'secret';
    const str = value == null ? '' : String(value);
    const display = isSecret ? '•'.repeat(str.length) : str;
    // text/secret reuse Input: its rounded box, ▎ cursor, placeholder + error.
    return (
      <Box flexDirection="column">
        <Input value={display} placeholder={field.placeholder ?? ''} focused={focusedHere} error={error} />
        {isSecret && focusedHere ? (
          <Box paddingLeft={1}>
            <Text color={tokens.fgFaint}>{'␣ reveal'}</Text>
          </Box>
        ) : null}
      </Box>
    );
  }

  if (field.kind === 'toggle') {
    const on = !!value;
    return (
      <Box flexDirection="row">
        <Choice selected={on} label={on ? 'enabled' : 'disabled'} focused={focusedHere} />
      </Box>
    );
  }

  // select / multiselect — inline SELECTION tokens, one focus stop per choice.
  const choices = resolveChoices(field, values);
  const selectedSet =
    field.kind === 'multiselect'
      ? new Set(Array.isArray(value) ? value : [])
      : new Set(value != null && value !== '' ? [String(value)] : []);
  if (choices.length === 0) {
    return (
      <Box paddingLeft={1}>
        <Text color={tokens.fgDim}>—</Text>
      </Box>
    );
  }
  return (
    <Box flexWrap="wrap" flexDirection="row">
      {choices.map((c) => (
        <Choice
          key={c.id}
          selected={selectedSet.has(c.id)}
          label={c.label}
          focused={!!focusStop && focusStop.name === field.name && focusStop.choiceId === c.id}
        />
      ))}
    </Box>
  );
}

export interface FormProps {
  /** The fields, top to bottom. */
  fields: FieldSpec[];
  /** Current values, keyed by field name. */
  values?: FormValues;
  /** The focused stop id (from {@link useFormNavigation}'s `focusId`). */
  focusId?: string | null;
  /** Per-field error messages (e.g. from {@link validateForm}). */
  errors?: Record<string, string>;
}

/**
 * Render-only: `fields` + `values` + `focusId` (+ `errors`) in; glyphs, colours,
 * the focus fill, required markers, and error lines out. Reads no keys — pair it
 * with {@link useFormNavigation} and the app's `useInput`.
 */
export function Form({ fields, values = {}, focusId, errors = {} }: FormProps): React.ReactElement {
  const stops = buildStops(fields, values);
  const focusStop = stops.find((s) => s.id === focusId) ?? null;
  return (
    <Box flexDirection="column">
      {fields.map((f) => {
        const textual = f.kind === 'text' || f.kind === 'secret';
        return (
          <Box key={f.name} flexDirection="column" marginBottom={1}>
            <FieldLabel label={f.label} required={f.required} />
            <FieldControl field={f} value={values[f.name]} values={values} focusStop={focusStop} error={errors[f.name]} />
            {textual ? null : <ErrorLine msg={errors[f.name]} />}
          </Box>
        );
      })}
    </Box>
  );
}

import React from 'react';
import { render } from 'ink-testing-library';
import { describe, test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import {
  Form,
  validateForm,
  buildStops,
  resolveChoices,
  type FieldSpec,
} from '../src/components/Form.js';
import { ProgressList, type ProgressItem } from '../src/components/ProgressList.js';
import { registerGlyphs, DEVINFRA } from '../src/glyphs/glyphs.js';

const wrap = (node: React.ReactElement) =>
  render(<ThemeProvider iconSet="unicode">{node}</ThemeProvider>);

describe('Form — pure helpers', () => {
  const FIELDS: FieldSpec[] = [
    { name: 'name', kind: 'text', label: 'Author', required: true },
    { name: 'versions', kind: 'multiselect', label: 'PHP', min: 1, choices: ['8.2', '8.3', '8.4'] },
    { name: 'default', kind: 'select', label: 'Default', optionsFrom: 'versions' },
  ];

  test('validateForm flags a required empty field', () => {
    const { ok, errors } = validateForm(FIELDS, { name: '', versions: ['8.3'] });
    expect(ok).toBe(false);
    expect(errors.name).toBe('required');
  });

  test('validateForm enforces multiselect min', () => {
    const { errors } = validateForm(FIELDS, { name: 'Ada', versions: [] });
    expect(errors.versions).toBe('select at least 1');
  });

  test('validateForm passes when satisfied', () => {
    expect(validateForm(FIELDS, { name: 'Ada', versions: ['8.3'] }).ok).toBe(true);
  });

  test('optionsFrom derives choices from another field value', () => {
    const def = FIELDS[2]!;
    expect(resolveChoices(def, { versions: ['8.3', '8.4'] })).toEqual([
      { id: '8.3', label: '8.3' },
      { id: '8.4', label: '8.4' },
    ]);
  });

  test('buildStops makes one stop per choice for choice fields, one otherwise', () => {
    const stops = buildStops(FIELDS, { versions: ['8.3'] });
    // text(1) + multiselect(3 choices) + select(1 derived choice) = 5
    expect(stops.map((s) => s.id)).toEqual([
      'name',
      'versions::8.2',
      'versions::8.3',
      'versions::8.4',
      'default::8.3',
    ]);
  });
});

describe('Form — render', () => {
  test('draws the label and a required marker, never a raw glyph prop', () => {
    const fields: FieldSpec[] = [{ name: 'tok', kind: 'text', label: 'Token', required: true }];
    const { lastFrame } = wrap(<Form fields={fields} values={{ tok: '' }} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Token');
    expect(frame).toContain('*');
  });

  test('secret masks its value to bullets', () => {
    const fields: FieldSpec[] = [{ name: 'tok', kind: 'secret', label: 'Token' }];
    const { lastFrame } = wrap(<Form fields={fields} values={{ tok: 'abcd' }} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('••••');
    expect(frame).not.toContain('abcd');
  });

  test('multiselect draws ☑ for selected and ☐ for unselected (framework-owned)', () => {
    const fields: FieldSpec[] = [
      { name: 'v', kind: 'multiselect', label: 'PHP', choices: ['8.2', '8.3'] },
    ];
    const { lastFrame } = wrap(<Form fields={fields} values={{ v: ['8.3'] }} focusId="v::8.3" />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('☑'); // selected
    expect(frame).toContain('☐'); // unselected
    expect(frame).toContain('8.2');
    expect(frame).toContain('8.3');
  });

  test('an error on a non-textual field prints a ✗ line', () => {
    const fields: FieldSpec[] = [
      { name: 'v', kind: 'multiselect', label: 'PHP', min: 1, choices: ['8.2'] },
    ];
    const { lastFrame } = wrap(
      <Form fields={fields} values={{ v: [] }} errors={{ v: 'select at least 1' }} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('✗');
    expect(frame).toContain('select at least 1');
  });
});

describe('ProgressList', () => {
  const ITEMS: ProgressItem[] = [
    { id: 'a', label: 'install deps', state: 'ok', meta: '2.1s' },
    { id: 'b', label: 'global install', state: 'running', meta: 'installing…' },
    { id: 'c', label: 'pair device', state: 'waiting', meta: 'press ↵' },
    { id: 'd', label: 'up', state: 'pending', meta: 'queued' },
    { id: 'e', label: 'relay', state: 'skipped', meta: 'not selected' },
    { id: 'f', label: 'broken', state: 'failed', meta: 'exit 1' },
  ];

  test('maps each state to its framework glyph (no glyph prop)', () => {
    const { lastFrame } = wrap(<ProgressList items={ITEMS} activeId="b" animate={false} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('✓'); // ok
    expect(frame).toContain('◐'); // waiting
    expect(frame).toContain('◯'); // pending
    expect(frame).toContain('◌'); // skipped
    expect(frame).toContain('✗'); // failed
  });

  test('the running line shows a spinner frame, not a static glyph', () => {
    const { lastFrame } = wrap(<ProgressList items={ITEMS} activeId="b" animate={false} />);
    // braille frame 0 — the one sanctioned animation on the active line
    expect(lastFrame() ?? '').toContain('⠋');
  });

  test('labels and meta render', () => {
    const { lastFrame } = wrap(<ProgressList items={ITEMS} activeId="b" animate={false} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('install deps');
    expect(frame).toContain('installing…');
  });

  test('windows to height and shows a "N more" overflow marker', () => {
    const { lastFrame } = wrap(
      <ProgressList items={ITEMS} activeId="a" height={3} animate={false} />,
    );
    expect(lastFrame() ?? '').toContain('more');
  });

  test('renders a registered domain glyph + its colour', () => {
    registerGlyphs(DEVINFRA);
    const items: ProgressItem[] = [{ id: 'x', domain: 'syncthing', label: 'pair', state: 'waiting' }];
    const { lastFrame } = wrap(<ProgressList items={items} activeId="x" animate={false} />);
    // syncthing degrades to its unicode fallback ↻ (no verified nerd codepoint)
    expect(lastFrame() ?? '').toContain('↻');
  });
});

import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { List, type ListRowData } from '../src/components/List.js';
import { registerGlyphs, COMMON_DOMAINS } from '../src/glyphs/glyphs.js';

// Domain glyphs are app content, not core — register the common pack so a
// `domain` name resolves to a glyph (here, `database` → unicode `db`).
registerGlyphs(COMMON_DOMAINS);

const rows: ListRowData[] = [
  { id: 'db', label: 'production-db', state: 'installed', meta: 'online', domain: 'database' },
  { id: 'cache', label: 'redis-cache', state: 'pending', meta: 'idle' },
  { id: 'queue', label: 'job-queue', state: 'warn', meta: 'drift' },
];

test('renders every label, the focus caret on the focused row, and meta', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <List rows={rows} focusedId="cache" />
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';

  // every label is present
  expect(frame).toContain('production-db');
  expect(frame).toContain('redis-cache');
  expect(frame).toContain('job-queue');

  // the unicode focus caret marks the focused row
  expect(frame).toContain('►');

  // the caret sits on the focused row's line, beside its label
  const caretLine = frame.split('\n').find((line) => line.includes('►')) ?? '';
  expect(caretLine).toContain('redis-cache');

  // a meta string is pushed to the right
  expect(frame).toContain('online');
});

test('resolves the state intent to its glyph (installed → check)', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <List rows={rows} />
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';
  // `state="installed"` → the framework draws ✓ on the production-db row.
  const dbLine = frame.split('\n').find((line) => line.includes('production-db')) ?? '';
  expect(dbLine).toContain('✓');
});

test('ascii icon set falls back to ">" for the focus caret', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="ascii">
      <List rows={rows} focusedId="db" />
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';

  // ascii caret instead of the unicode ►
  expect(frame).toContain('>');
  expect(frame).not.toContain('►');

  const caretLine = frame.split('\n').find((line) => line.includes('>')) ?? '';
  expect(caretLine).toContain('production-db');
});

test('resolves the registered domain glyph from its name, before the label', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <List rows={rows} />
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';

  // `domain="database"` → the framework resolves the unicode fallback `▤`, drawn
  // before the label (the consumer never passed a glyph, only the name).
  const dbLine = frame.split('\n').find((line) => line.includes('production-db')) ?? '';
  expect(dbLine).toContain('▤');
  expect(dbLine.indexOf('▤')).toBeLessThan(dbLine.indexOf('production-db'));
});

test('reserves the state cell on state-less rows so labels stay column-aligned', () => {
  // Two rows: one with a state intent, one without. The state-less row must
  // still reserve the cell (a blank space), so both labels start at the same
  // column — the kit's `{glyph || " "}` placeholder behaviour, by intent.
  const mixed: ListRowData[] = [
    { id: 'on', label: 'has-state', state: 'ok' },
    { id: 'off', label: 'no-state' },
  ];

  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <List rows={mixed} />
    </ThemeProvider>,
  );

  const lines = (lastFrame() ?? '').split('\n');
  const stated = lines.find((line) => line.includes('has-state')) ?? '';
  const bare = lines.find((line) => line.includes('no-state')) ?? '';

  expect(stated.indexOf('has-state')).toBe(bare.indexOf('no-state'));
});

test('a selection intent renders the checkbox glyph (■ / ☐ / ▣)', () => {
  const checks: ListRowData[] = [
    { id: 'a', label: 'pull images', selected: true },
    { id: 'b', label: 'run migrations', selected: false },
    { id: 'c', label: 'base image', locked: true },
  ];
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <List rows={checks} />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('■'); // selected (width-1; ☑ tore the grid on narrow terminals)
  expect(frame).toContain('☐'); // unselected
  expect(frame).toContain('▣'); // locked (required, non-toggle)
});

test('renders a selected-fill row without a caret and keeps its label', () => {
  // selectedIds drives the (ANSI-stripped, so unobservable here) fill colour;
  // assert the row still renders its label and is not marked with the caret.
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <List rows={rows} selectedIds={new Set(['db'])} />
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';
  expect(frame).toContain('production-db');
  // nothing is focused, so no caret anywhere
  expect(frame).not.toContain('►');
});

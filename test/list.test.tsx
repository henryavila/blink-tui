import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { List, type ListRowData } from '../src/components/List.js';

const rows: ListRowData[] = [
  { id: 'db', label: 'production-db', glyph: '✓', meta: 'online', domain: 'db' },
  { id: 'cache', label: 'redis-cache', glyph: '◯', meta: 'idle' },
  { id: 'queue', label: 'job-queue', glyph: '⚠', meta: 'drift' },
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
  expect(frame).toContain('▸');

  // the caret sits on the focused row's line, beside its label
  const caretLine = frame.split('\n').find((line) => line.includes('▸')) ?? '';
  expect(caretLine).toContain('redis-cache');

  // a meta string is pushed to the right
  expect(frame).toContain('online');
});

test('ascii icon set falls back to ">" for the focus caret', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="ascii">
      <List rows={rows} focusedId="db" />
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';

  // ascii caret instead of the unicode ▸
  expect(frame).toContain('>');
  expect(frame).not.toContain('▸');

  const caretLine = frame.split('\n').find((line) => line.includes('>')) ?? '';
  expect(caretLine).toContain('production-db');
});

test('renders the resolved domain glyph on the row that carries one', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <List rows={rows} />
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';

  // the domain string sits on the production-db row, before its label
  const dbLine = frame.split('\n').find((line) => line.includes('production-db')) ?? '';
  expect(dbLine).toContain('db');
  expect(dbLine.indexOf('db')).toBeLessThan(dbLine.indexOf('production-db'));
});

test('reserves the glyph cell on glyph-less rows so labels stay column-aligned', () => {
  // Two unfocused rows: one with a state glyph, one without. The glyph-less row
  // must still reserve the cell (a blank space), so both labels start at the
  // same column — the web kit's `{row.glyph || " "}` placeholder behaviour.
  const mixed: ListRowData[] = [
    { id: 'on', label: 'has-glyph', glyph: '✓' },
    { id: 'off', label: 'no-glyph' },
  ];

  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <List rows={mixed} />
    </ThemeProvider>,
  );

  const lines = (lastFrame() ?? '').split('\n');
  const glyphed = lines.find((line) => line.includes('has-glyph')) ?? '';
  const bare = lines.find((line) => line.includes('no-glyph')) ?? '';

  expect(glyphed.indexOf('has-glyph')).toBe(bare.indexOf('no-glyph'));
});

test('renders a selected row without a caret and keeps its label', () => {
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
  expect(frame).not.toContain('▸');
});

import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { Input } from '../src/components/CursorInput.js';

test('renders title, value and a trailing cursor when focused', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Input title="search" value="pg" focused />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('search');
  expect(frame).toContain('pg');
  // focused → live cursor (block is "on" at first frame, step-end timing)
  expect(frame).toContain('▎');
});

test('shows the placeholder while the value is empty', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Input title="search" value="" placeholder="type a query…" />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('type a query…');
});

test('error row sits below the pane with the cross glyph (unicode)', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Input title="port" value="3000" error="port in use" />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('port in use');
  expect(frame).toContain('✗');
});

test('error row falls back to the ascii cross glyph', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="ascii">
      <Input title="port" value="3000" error="port in use" />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('port in use');
  expect(frame).toContain('[!]');
});

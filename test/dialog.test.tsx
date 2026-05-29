import React from 'react';
import { Box } from 'ink';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { Dialog } from '../src/components/Dialog.js';

test('Dialog renders title, body lines, and action labels (unicode)', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Box height={12}>
        <Dialog
          title="delete service"
          lines={['remove this service?', '↳ postgres']}
          actions={[
            { key: 'N', label: 'keep', primary: true },
            { key: 'y', label: 'delete' },
          ]}
        />
      </Box>
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';
  expect(frame).toContain('delete service');
  expect(frame).toContain('remove this service?');
  // every supplied body line renders, including the dependency-arrow glyph
  expect(frame).toContain('↳ postgres');
  expect(frame).toContain('keep');
  expect(frame).toContain('delete');
  // the primary key chip keeps its 1-cell inverse-video padding ` N `
  expect(frame).toContain(' N  keep');
  // default tone is a focused (lavender) ROUNDED pane — never a double line
  expect(frame).toContain('╭');
  expect(frame).not.toContain('╔');
});

test('Dialog falls back to ascii border in ascii icon set', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="ascii">
      <Box height={12}>
        <Dialog
          title="delete service"
          lines={['remove this service?']}
          actions={[{ key: 'y', label: 'delete' }]}
        />
      </Box>
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';
  expect(frame).toContain('delete service');
  expect(frame).toContain('delete');
  // ascii mode collapses the rounded border to + - |
  expect(frame).toContain('+');
  expect(frame).not.toContain('╭');
});

test('Dialog error tone renders a red rounded pane (no double line)', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Box height={12}>
        <Dialog
          title="fatal"
          tone="error"
          lines={['disk full']}
          actions={[{ key: 'o', label: 'ok', primary: true }]}
        />
      </Box>
    </ThemeProvider>,
  );

  const frame = lastFrame() ?? '';
  expect(frame).toContain('fatal');
  expect(frame).toContain('disk full');
  expect(frame).toContain('ok');
  expect(frame).toContain('╭');
  expect(frame).not.toContain('╔');
});

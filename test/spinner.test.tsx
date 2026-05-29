import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { Spinner } from '../src/components/Spinner.js';
import { spinnerFrames } from '../src/glyphs/glyphs.js';

test('ascii icon set renders a classic spinner frame', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="ascii">
      <Spinner active={false} />
    </ThemeProvider>,
  );
  const out = lastFrame() ?? '';
  expect(['|', '/', '-', '\\'].some((c) => out.includes(c))).toBe(true);
  // frame 0 is deterministic
  expect(out).toContain(spinnerFrames.ascii[0]);
});

test('unicode icon set renders a braille spinner frame', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Spinner active={false} />
    </ThemeProvider>,
  );
  const out = lastFrame() ?? '';
  expect(spinnerFrames.braille.some((c) => out.includes(c))).toBe(true);
  expect(out).toContain('⠋');
});

test('nerd icon set also renders the braille alphabet', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="nerd">
      <Spinner active={false} />
    </ThemeProvider>,
  );
  const out = lastFrame() ?? '';
  // nerd shares the braille frames with unicode; only ascii differs.
  expect(out).toContain(spinnerFrames.braille[0]);
  expect(out).not.toContain(spinnerFrames.ascii[0]);
});

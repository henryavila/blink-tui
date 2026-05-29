import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { Footer } from '../src/components/Footer.js';

test('footer renders hotkeys, descriptions, and the right slot', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Footer
        keys={[
          { k: 'tab', desc: 'switch pane' },
          { k: 'q', desc: 'quit' },
        ]}
        right={'6 of 8'}
      />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('tab');
  expect(frame).toContain('switch pane');
  expect(frame).toContain('q');
  expect(frame).toContain('quit');
  expect(frame).toContain('6 of 8');
});

test('footer omits the right slot when not provided', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="unicode">
      <Footer keys={[{ k: 'enter', desc: 'open' }]} />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('enter');
  expect(frame).toContain('open');
});

test('footer is single-line under the ascii icon set', () => {
  const { lastFrame } = render(
    <ThemeProvider iconSet="ascii">
      <Footer keys={[{ k: '/', desc: 'search' }]} right={'1 of 1'} />
    </ThemeProvider>,
  );
  const frame = lastFrame() ?? '';
  expect(frame).toContain('/');
  expect(frame).toContain('search');
  expect(frame).toContain('1 of 1');
  // hotkey bar is one cell tall by contract — no wrap onto a second row.
  expect(frame.split('\n')).toHaveLength(1);
});

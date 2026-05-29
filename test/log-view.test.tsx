import React from 'react';
import { render } from 'ink-testing-library';
import { describe, test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { LogView } from '../src/components/LogView.js';

const buf = (n: number) => Array.from({ length: n }, (_, i) => `l${i}`);

describe('LogView', () => {
  test('shows only the tail that fits, with a ▴ marker for clipped older lines', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <LogView lines={buf(10)} height={4} width={20} wrap={false} />
      </ThemeProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('l9');
    expect(frame).toContain('l8');
    expect(frame).toContain('l7');
    expect(frame).not.toContain('l6');
    expect(frame).toContain('7 more'); // 10 lines, 3 content rows → 7 clipped
    expect(frame).toContain('▴');
  });

  test('following shows the newest line after an append', () => {
    const { lastFrame, rerender } = render(
      <ThemeProvider iconSet="unicode">
        <LogView lines={buf(10)} height={4} width={20} wrap={false} />
      </ThemeProvider>,
    );
    rerender(
      <ThemeProvider iconSet="unicode">
        <LogView lines={buf(12)} height={4} width={20} wrap={false} />
      </ThemeProvider>,
    );
    expect(lastFrame()).toContain('l11');
  });

  test('follow=false freezes the window as new lines append', () => {
    const { lastFrame, rerender } = render(
      <ThemeProvider iconSet="unicode">
        <LogView lines={buf(10)} height={4} width={20} wrap={false} follow={false} />
      </ThemeProvider>,
    );
    expect(lastFrame()).toContain('l9');
    rerender(
      <ThemeProvider iconSet="unicode">
        <LogView lines={buf(12)} height={4} width={20} wrap={false} follow={false} />
      </ThemeProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('l9'); // window held on the same content
    expect(frame).not.toContain('l11'); // newest appends stay off-screen
  });

  test('wrap spreads a long line across ceil(len/width) visual rows', () => {
    const long = 'x'.repeat(50);
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <LogView lines={[long]} height={6} width={20} wrap />
      </ThemeProvider>,
    );
    const xLines = (lastFrame() ?? '').split('\n').filter((l) => l.includes('x'));
    expect(xLines).toHaveLength(3); // ceil(50 / 20)
  });

  test('truncate keeps a long line on a single visual row', () => {
    const long = 'x'.repeat(50);
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <LogView lines={[long]} height={6} width={20} wrap={false} />
      </ThemeProvider>,
    );
    const xLines = (lastFrame() ?? '').split('\n').filter((l) => l.includes('x'));
    expect(xLines).toHaveLength(1);
  });
});

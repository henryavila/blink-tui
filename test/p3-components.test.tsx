import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { Banner } from '../src/components/Banner.js';
import { ProgressBar } from '../src/components/ProgressBar.js';
import { Dialog } from '../src/components/Dialog.js';
import { List, type ListRowData } from '../src/components/List.js';

describe('Banner', () => {
  test('the framework draws the tone glyph (success → check) — no glyph prop', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <Banner tone="success" text="saved" />
      </ThemeProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('✓');
    expect(frame).toContain('saved');
  });

  test('children win over text', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <Banner text="ignored">
          <Text>rich body</Text>
        </Banner>
      </ThemeProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('rich body');
    expect(frame).not.toContain('ignored');
  });
});

describe('ProgressBar', () => {
  test('maps value to filled cells (unicode)', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <ProgressBar value={0.5} width={10} />
      </ThemeProvider>,
    );
    expect(lastFrame()).toContain('█████'); // 5 of 10 cells
  });

  test('clamps above 1 and below 0', () => {
    const full = render(
      <ThemeProvider iconSet="unicode">
        <ProgressBar value={2} width={6} />
      </ThemeProvider>,
    );
    expect(full.lastFrame()).toContain('██████');

    const empty = render(
      <ThemeProvider iconSet="unicode">
        <ProgressBar value={-1} width={6} />
      </ThemeProvider>,
    );
    expect(empty.lastFrame()).not.toContain('█');
  });

  test('picks a partial eighth for a fractional cell', () => {
    // 0.05 of 10 cells = 0.5 cell → 4 eighths → ▌
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <ProgressBar value={0.05} width={10} />
      </ThemeProvider>,
    );
    expect(lastFrame()).toContain('▌');
  });

  test('ascii degrades to whole # cells', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="ascii">
        <ProgressBar value={0.5} width={10} />
      </ThemeProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('#####');
    expect(frame).not.toContain('█');
  });
});

describe('Dialog children', () => {
  const rows: ListRowData[] = [{ id: 'a', label: 'choice-a' }];

  test('renders a rich children body inside the frame', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <Dialog title="pick">
          <List rows={rows} focusedId="a" />
        </Dialog>
      </ThemeProvider>,
    );
    expect(lastFrame()).toContain('choice-a');
  });

  test('children win over lines when both are supplied', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <Dialog title="pick" lines={['plain line']}>
          <Text>rich line</Text>
        </Dialog>
      </ThemeProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('rich line');
    expect(frame).not.toContain('plain line');
  });

  test('lines still render when no children are given (regression)', () => {
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <Dialog title="confirm" lines={['delete this?']} />
      </ThemeProvider>,
    );
    expect(lastFrame()).toContain('delete this?');
  });
});

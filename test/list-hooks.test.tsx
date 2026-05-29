import React from 'react';
import { Text, useInput } from 'ink';
import { render } from 'ink-testing-library';
import { describe, test, expect } from 'vitest';
import { ThemeProvider } from '../src/theme/context.js';
import { useListNavigation } from '../src/hooks/useListNavigation.js';
import { useListSelection, type SelectionMode } from '../src/hooks/useListSelection.js';

const ids = ['a', 'b', 'c'];
// Explicit ESC escapes so the bytes are unambiguous regardless of editor/encoding.
const DOWN = '\u001B[B';
const UP = '\u001B[A';

function Probe({ mode, min }: { mode: SelectionMode; min?: number }) {
  const nav = useListNavigation({ ids });
  const sel = useListSelection({ ids, mode, min });
  useInput((input, key) => {
    if (key.downArrow) nav.focusNext();
    if (key.upArrow) nav.focusPrev();
    if (input === ' ' && nav.focusedId) sel.toggle(nav.focusedId);
  });
  return (
    <Text>{`focus=${nav.focusedId} sel=[${[...sel.selectedIds].join(',')}] blocked=${sel.blocked}`}</Text>
  );
}

/** Render a probe and return a `press` that delivers one key per render tick. */
function mount(mode: SelectionMode, min?: number) {
  const { stdin, lastFrame } = render(
    <ThemeProvider>
      <Probe mode={mode} min={min} />
    </ThemeProvider>,
  );
  const press = async (key: string) => {
    await new Promise((r) => setTimeout(r, 25)); // let the prior render commit + listener stay attached
    stdin.write(key);
    await new Promise((r) => setTimeout(r, 25));
  };
  return { press, frame: () => lastFrame() ?? '' };
}

describe('useListNavigation (intent methods wired to keys)', () => {
  test('moves focus with arrows and clamps at the ends', async () => {
    const { press, frame } = mount('multi');
    expect(frame()).toContain('focus=a'); // seeded to the first id

    await press(DOWN);
    expect(frame()).toContain('focus=b');

    await press(DOWN); // → c
    await press(DOWN); // past the end → stays c (clamp, not wrap)
    expect(frame()).toContain('focus=c');

    await press(UP);
    expect(frame()).toContain('focus=b');
  });
});

describe('useListSelection', () => {
  test('multi toggles on and off', async () => {
    const { press, frame } = mount('multi');

    await press(' '); // a on
    expect(frame()).toContain('sel=[a]');

    await press(DOWN);
    await press(' '); // b on
    expect(frame()).toContain('sel=[a,b]');

    await press(UP);
    await press(' '); // a off
    expect(frame()).toContain('sel=[b]');
  });

  test('min blocks deselecting the last item and surfaces `blocked`', async () => {
    const { press, frame } = mount('multi', 1);

    await press(' '); // select a
    expect(frame()).toContain('sel=[a]');

    await press(' '); // try to deselect the only one → blocked
    expect(frame()).toContain('sel=[a]');
    expect(frame()).toContain('blocked=true');
  });

  test('single keeps exactly one selected', async () => {
    const { press, frame } = mount('single');

    await press(' '); // select a
    expect(frame()).toContain('sel=[a]');

    await press(DOWN);
    await press(' '); // select b → a drops
    expect(frame()).toContain('sel=[b]');
  });
});

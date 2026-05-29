import React, { useEffect } from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, test } from 'vitest';
import {
  ThemeProvider,
  useTokens,
  useThemeControls,
  buildTokens,
  getTheme,
  hasTheme,
  listThemes,
  registerTheme,
  defaultTheme,
  tokyonight,
  latte,
  neutral,
} from '../src/index.js';

describe('theme registry', () => {
  test('default theme is tokyonight', () => {
    expect(defaultTheme.id).toBe('tokyonight');
    expect(getTheme('tokyonight')).toBe(defaultTheme);
  });

  test('ships the seven built-in themes in picker order', () => {
    const ids = listThemes().map((t) => t.id);
    expect(ids).toEqual(['neutral', 'contrast', 'vivid', 'nord', 'gruvbox', 'tokyonight', 'latte']);
    expect(listThemes().find((t) => t.id === 'latte')?.mode).toBe('light');
  });

  test('unknown id falls back to the default theme', () => {
    expect(getTheme('nope')).toBe(defaultTheme);
    expect(hasTheme('nope')).toBe(false);
  });

  test('buildTokens maps roles onto palette slots, identically per theme', () => {
    const tok = buildTokens(tokyonight);
    expect(tok.bg).toBe(tokyonight.base);
    expect(tok.accent).toBe(tokyonight.lavender);
    expect(tok.stateOk).toBe(tokyonight.green);
    expect(tok.domainBlue).toBe(tokyonight.blue);
    expect(tok.fgInverse).toBe(tokyonight.base);
  });
});

describe('intent-variant themes (same palette, respent intent)', () => {
  test('contrast deepens the canvas and brightens borders without adding hue', () => {
    const c = getTheme('contrast');
    expect(c.palette).toBe(neutral); // reuses neutral's palette
    expect(c.tokens.bg).toBe(neutral.crust); // deeper canvas
    expect(c.tokens.border).toBe(neutral.overlay1); // brighter border
  });

  test('vivid colours the selection (accent mixed into crust) and pending', () => {
    const v = getTheme('vivid');
    expect(v.palette).toBe(neutral);
    // pending goes chromatic
    expect(v.tokens.statePending).toBe(neutral.sky);
    // selection fill is a computed mix — a real hex, darker than the accent,
    // and not the plain neutral surface fill
    expect(v.tokens.bgSelected).toMatch(/^#[0-9a-f]{6}$/);
    expect(v.tokens.bgSelected).not.toBe(neutral.surface0);
    expect(v.tokens.bgFocused).not.toBe(v.tokens.bgSelected);
  });
});

describe('registerTheme', () => {
  test('inherits the base palette, overrides only what is supplied', () => {
    const t = registerTheme({
      id: 'test-dracula',
      label: 'dracula',
      blurb: 'test',
      palette: { lavender: '#bd93f9', green: '#50fa7b' },
    });
    // overridden slots win…
    expect(t.palette.lavender).toBe('#bd93f9');
    expect(t.tokens.accent).toBe('#bd93f9');
    expect(t.tokens.stateOk).toBe('#50fa7b');
    // …the rest inherit from neutral (the default base)
    expect(t.palette.base).toBe(neutral.base);
    // and it shows up in the registry + picker
    expect(hasTheme('test-dracula')).toBe(true);
    expect(getTheme('test-dracula')).toBe(t);
    expect(listThemes().some((m) => m.id === 'test-dracula')).toBe(true);
  });

  test('intent overrides remap roles', () => {
    const t = registerTheme({
      id: 'test-intent',
      extends: 'neutral',
      intent: { statePending: '#abcdef' },
    });
    expect(t.tokens.statePending).toBe('#abcdef');
  });
});

describe('ThemeProvider switching', () => {
  test('starts on the requested theme', () => {
    function Probe() {
      const t = useTokens();
      return <Text>{t.accent}</Text>;
    }
    const { lastFrame } = render(
      <ThemeProvider theme="latte" iconSet="unicode">
        <Probe />
      </ThemeProvider>,
    );
    expect(lastFrame()).toContain(latte.lavender);
  });

  test('defaults to tokyonight when no theme is given', () => {
    function Probe() {
      const t = useTokens();
      return <Text>{t.accent}</Text>;
    }
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <Probe />
      </ThemeProvider>,
    );
    expect(lastFrame()).toContain(tokyonight.lavender);
  });

  test('setTheme repaints the tree from the new tokens', async () => {
    function Probe() {
      const t = useTokens();
      const { setTheme } = useThemeControls();
      useEffect(() => {
        setTheme('latte');
      }, [setTheme]);
      return <Text>{t.accent}</Text>;
    }
    const { lastFrame } = render(
      <ThemeProvider theme="neutral" iconSet="unicode">
        <Probe />
      </ThemeProvider>,
    );
    // the mount effect switches the surface; let the re-render flush
    await new Promise((r) => setTimeout(r, 20));
    expect(lastFrame()).toContain(latte.lavender);
  });
});

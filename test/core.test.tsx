import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, test } from 'vitest';
import {
  ThemeProvider,
  mochaTokens,
  catppuccinMocha,
  glyph,
  registerGlyphs,
  boxChars,
  spinnerFor,
  blocks,
  detectIconSet,
  useTokens,
  useGlyph,
} from '../src/index.js';

describe('theme', () => {
  test('semantic tokens map to the right Catppuccin hues', () => {
    expect(mochaTokens.bg).toBe(catppuccinMocha.base);
    expect(mochaTokens.accent).toBe(catppuccinMocha.lavender);
    expect(mochaTokens.stateOk).toBe(catppuccinMocha.green);
    expect(mochaTokens.stateErr).toBe(catppuccinMocha.red);
    expect(mochaTokens.fgInverse).toBe(catppuccinMocha.base);
  });

  test('ThemeProvider exposes tokens + glyph resolver to children', () => {
    function Probe() {
      const t = useTokens();
      const g = useGlyph();
      return <Text color={t.stateOk}>{g('check')} ok</Text>;
    }
    const { lastFrame } = render(
      <ThemeProvider iconSet="unicode">
        <Probe />
      </ThemeProvider>,
    );
    expect(lastFrame()).toContain('✓ ok');
  });
});

describe('glyphs (dual-mode)', () => {
  test('state glyphs resolve per icon set', () => {
    expect(glyph('check', 'unicode')).toBe('✓');
    expect(glyph('check', 'ascii')).toBe('[x]');
    expect(glyph('half', 'ascii')).toBe('[~]');
  });

  test('domain glyphs are Nerd Font PUA in nerd mode, text otherwise', () => {
    const nerd = glyph('postgresql', 'nerd');
    expect(nerd.codePointAt(0)).toBe(0xe76e);
    expect(glyph('postgresql', 'unicode')).toBe('pg');
    expect(glyph('postgresql', 'ascii')).toBe('pg');
  });

  test('unknown names render visibly (the name itself), never blank', () => {
    expect(glyph('definitely-not-a-glyph', 'unicode')).toBe('definitely-not-a-glyph');
  });

  test('registerGlyphs extends the registry', () => {
    registerGlyphs({ tailscale: { nerd: 'N', unicode: 'mesh', ascii: 'mesh' } });
    expect(glyph('tailscale', 'unicode')).toBe('mesh');
  });

  test('box chars: double/single unicode, collapse to ascii', () => {
    expect(boxChars('double', 'unicode').tl).toBe('╔');
    expect(boxChars('single', 'unicode').tl).toBe('┌');
    expect(boxChars('rounded', 'unicode').tl).toBe('╭');
    expect(boxChars('double', 'ascii').tl).toBe('+');
    expect(boxChars('single', 'ascii').h).toBe('-');
  });

  test('spinner frames per icon set', () => {
    expect(spinnerFor('ascii')[0]).toBe('|');
    expect(spinnerFor('unicode')[0]).toBe('⠋');
    expect(blocks.cursor).toBe('▎');
  });
});

describe('detectIconSet cascade', () => {
  const noConfig = { configPath: '/nonexistent/blink-preferences.json' };

  test('hard env override wins', async () => {
    expect(await detectIconSet({ ...noConfig, env: { BLINK_ICON_SET: 'nerd' } })).toBe('nerd');
    expect(await detectIconSet({ ...noConfig, env: { BLINK_ASCII: '1' } })).toBe('ascii');
    expect(await detectIconSet({ ...noConfig, env: { BLINK_NERD_FONT: '0' } })).toBe('unicode');
  });

  test('font marker → nerd', async () => {
    const here = new URL(import.meta.url).pathname; // this file exists
    expect(
      await detectIconSet({ ...noConfig, env: { TERM: 'xterm' }, markerFiles: [here] }),
    ).toBe('nerd');
  });

  test('terminal hints', async () => {
    expect(await detectIconSet({ ...noConfig, env: { WT_SESSION: '1', TERM: 'xterm' } })).toBe('nerd');
  });

  test('CI / dumb → ascii', async () => {
    expect(await detectIconSet({ ...noConfig, env: { CI: '1', TERM: 'xterm' } })).toBe('ascii');
    expect(await detectIconSet({ ...noConfig, env: { TERM: 'dumb' } })).toBe('ascii');
  });

  test('safe default → unicode', async () => {
    expect(await detectIconSet({ ...noConfig, env: { TERM: 'xterm-256color' } })).toBe('unicode');
  });
});

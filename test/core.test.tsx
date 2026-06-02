import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, test } from 'vitest';
import stringWidth from 'string-width';
import {
  ThemeProvider,
  mochaTokens,
  catppuccinMocha,
  glyph,
  glyphColor,
  hasGlyph,
  selectionIntents,
  stateGlyphs,
  navGlyphs,
  registerGlyphs,
  COMMON_DOMAINS,
  COMPANIES,
  SYSTEM,
  GLYPH_PACKS,
  stateGlyph,
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

  test('domain glyphs are app content — unregistered in core until opted in', () => {
    // Not seeded in core: an unknown domain renders its own name, never tofu.
    expect(glyph('postgresql', 'nerd')).toBe('postgresql');
    // Opt into the common pack, then the same name resolves + carries its colour.
    registerGlyphs(COMMON_DOMAINS);
    expect(glyph('postgresql', 'nerd').codePointAt(0)).toBe(0xe76e);
    // unicode degrades to a single-cell symbol, ascii to a 2-char code — both
    // grid-safe, never tofu.
    expect(glyph('postgresql', 'unicode')).toBe('▤');
    expect(glyph('postgresql', 'ascii')).toBe('pg');
    // Colour is intent, not style: the entry owns a hue-family TOKEN that the
    // active theme resolves — so postgres recolours with the surface.
    expect(glyphColor('postgresql')).toBe('domainBlue');
    expect(mochaTokens.domainBlue).toBe(catppuccinMocha.blue);
  });

  test('unknown names render visibly (the name itself), never blank', () => {
    expect(glyph('definitely-not-a-glyph', 'unicode')).toBe('definitely-not-a-glyph');
  });

  test('registerGlyphs extends the registry', () => {
    registerGlyphs({ tailscale: { nerd: 'N', unicode: 'mesh', ascii: 'mesh' } });
    expect(glyph('tailscale', 'unicode')).toBe('mesh');
  });

  test('intent → glyph: a state name resolves to its glyph + colour token', () => {
    expect(stateGlyph('installed')).toEqual({ glyph: 'check', token: 'stateOk' });
    expect(stateGlyph('missing')).toEqual({ glyph: 'cross', token: 'stateErr' });
    expect(stateGlyph('drift')).toEqual({ glyph: 'half', token: 'stateDrift' });
    expect(stateGlyph('nope')).toBeNull();
  });

  test('box chars: single + rounded unicode, collapse to ascii (no double line)', () => {
    expect(boxChars('single', 'unicode').tl).toBe('┌');
    expect(boxChars('rounded', 'unicode').tl).toBe('╭');
    expect(boxChars('rounded', 'ascii').tl).toBe('+');
    expect(boxChars('single', 'ascii').h).toBe('-');
  });

  test('spinner frames per icon set', () => {
    expect(spinnerFor('ascii')[0]).toBe('|');
    expect(spinnerFor('unicode')[0]).toBe('⠋');
    expect(blocks.cursor).toBe('▎');
  });
});

describe('SYSTEM pack (general-purpose domain glyphs)', () => {
  test('covers the system/UI domain names with curated fallbacks', () => {
    registerGlyphs(SYSTEM);
    // A representative spread of the pack's names, all opted-in.
    for (const name of ['terminal', 'code', 'globe', 'home', 'key', 'mail', 'phone', 'package', 'sync', 'text', 'tools']) {
      expect(hasGlyph(name)).toBe(true);
      // unicode + ascii degrade, never the bare name (never tofu).
      expect(glyph(name, 'unicode')).not.toBe(name);
      expect(glyph(name, 'ascii')).not.toBe(name);
      expect(glyphColor(name)).toBeTruthy();
    }
    // The Font-Awesome nerd codepoints resolve (spot-check terminal = fa-terminal).
    expect(glyph('terminal', 'nerd').codePointAt(0)).toBe(0xf120);
    expect(glyph('mail', 'nerd').codePointAt(0)).toBe(0xf0e0);
  });

  test('claude lives in COMPANIES and degrades to a width-1 mark (no verified NF glyph)', () => {
    registerGlyphs(COMPANIES);
    expect(hasGlyph('claude')).toBe(true);
    expect(glyph('claude', 'unicode')).toBe('✶');
    expect(glyph('claude', 'nerd')).toBe('✶'); // empty nerd → falls back to unicode
    expect(glyphColor('claude')).toBe('accent');
  });
});

describe('contract-glyph grid-safety invariant', () => {
  // The Tier-0 contract glyphs (state + nav) render inside fixed-width cells and
  // selection/focus bands. Any width-2 entry that a narrow-ambiguous terminal
  // paints as 1 tears the grid (the ☑→■, ⚠→△, ◀→◄ audits). Every contract
  // glyph variant MUST be exactly one cell.
  test('every state + nav glyph variant is width-1', () => {
    for (const [table, tname] of [
      [stateGlyphs, 'state'],
      [navGlyphs, 'nav'],
    ] as const) {
      for (const [name, v] of Object.entries(table)) {
        for (const set of ['nerd', 'unicode', 'ascii'] as const) {
          // ascii is allowed multi-char ([x], [~]) — only the glyph forms must be 1 cell.
          if (set === 'ascii') continue;
          expect(stringWidth(v[set]), `${tname}.${name}.${set} = ${JSON.stringify(v[set])}`).toBe(1);
        }
      }
    }
  });
});

describe('selection-glyph grid-safety invariant', () => {
  // The checkbox column reserves a fixed cell width; a width-2 glyph that an
  // ambiguous-width terminal paints as 1 (e.g. the old ☑ = U+2611) tears a
  // phantom hole in the selection background right after the checkbox. Every
  // selection intent glyph MUST be width-1 in both nerd and unicode sets.
  test('selected / unselected / locked checkboxes are width-1', () => {
    for (const intent of ['selected', 'unselected', 'locked'] as const) {
      const name = selectionIntents[intent].glyph;
      for (const set of ['nerd', 'unicode'] as const) {
        expect(stringWidth(glyph(name, set)), `${intent} (${name}) in ${set}`).toBe(1);
      }
    }
  });
});

describe('glyph grid-safety invariant', () => {
  // The footer-drop class of bug: a double-wide unicode fallback silently breaks
  // the one-glyph-one-cell grid (List columns drift, highlight bands tear). Every
  // curated pack's unicode + ascii fallback must measure at most one cell wide.
  test('every pack glyph fallback is at most one cell wide (string-width)', () => {
    for (const [packName, pack] of Object.entries(GLYPH_PACKS)) {
      for (const [name, v] of Object.entries(pack)) {
        expect(stringWidth(v.unicode), `${packName}.${name} unicode "${v.unicode}"`).toBeLessThanOrEqual(1);
        // ascii codes are short labels (≤3) but must still never exceed their cell budget badly.
        expect(v.ascii.length, `${packName}.${name} ascii "${v.ascii}"`).toBeLessThanOrEqual(3);
      }
    }
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

/**
 * showcase — the blink INVENTORY, adapted for the terminal.
 *
 * A TUI port of the design system's "Component Showcase": one long, *scrolling*
 * page that exercises every token, glyph tier, and component primitive — plus a
 * live theme picker. The web page scrolls with the wheel; a TUI has no wheel, so
 * this adapts it to a keyboard-paged viewport (a fixed window over a tall content
 * column, clipped with overflow + a negative offset). Everything is driven by the
 * intent, not style API and recolours instantly when you switch theme.
 *
 * Run it: `npm run example` → pick "showcase" (or `npx tsx examples/showcase.tsx`).
 * Keys: ↑↓/j k scroll · space/b page · g/G top/bottom · t/T theme · ? help · q quit
 */
import React, { useEffect, useRef, useState } from 'react';
import { Writable } from 'node:stream';
import { render, Box, Text, measureElement, useApp, useInput } from 'ink';
import type { DOMElement } from 'ink';
import {
  ThemeProvider,
  detectIconSet,
  Pane,
  List,
  Header,
  Banner,
  DescriptionList,
  Footer,
  Input,
  Dialog,
  Spinner,
  ProgressBar,
  Cursor,
  useTokens,
  useGlyph,
  useStdoutDimensions,
  useThemeControls,
  registerGlyphs,
  COMMON_DOMAINS,
  GLYPH_PACKS,
  blocks,
  type SemanticTokens,
  type GlyphVariants,
  type ListRowData,
  type DescriptionItem,
} from '../src/index.js';

// blink core ships no domain glyphs; the inventory opts into the Tier 1 pack —
// exactly as a real product would at boot (framework owns the mechanism, the app
// owns the content). The Tier 2 packs are read straight from GLYPH_PACKS for the
// category grid below; they're documentation there, so they need no registration.
registerGlyphs(COMMON_DOMAINS);

const CLAMP = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

// ── small specimen helpers — composed from primitives, contract-clean ──────────

/** Section heading: an inverse-video bar (the TUI "h1") + a dim subtitle line. */
function SectionTitle({ title, sub }: { title: string; sub?: string }): React.ReactElement {
  const t = useTokens();
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text color={t.fgInverse} backgroundColor={t.bgInverse}>{' ' + title + ' '}</Text>
      </Box>
      {sub ? <Text color={t.fgFaint} wrap="truncate">{sub}</Text> : null}
    </Box>
  );
}

/** One glyph in a fixed cell + its name — the legend/bank atom. */
function GlyphCell({
  name,
  label,
  color,
  width = 16,
}: {
  name: string;
  label: string;
  color: string;
  width?: number;
}): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  return (
    <Box width={width} flexShrink={0}>
      <Box width={3} flexShrink={0}>
        <Text color={color} wrap="truncate">{g(name)}</Text>
      </Box>
      <Text color={t.fgDim} wrap="truncate">{label}</Text>
    </Box>
  );
}

/** A glyph drawn from a raw nerd char (pack data) + its name — for the pack grid. */
function PackCell({ char, label, color }: { char: string; label: string; color: string }): React.ReactElement {
  const t = useTokens();
  return (
    <Box width={15} flexShrink={0}>
      <Box width={3} flexShrink={0}>
        <Text color={color} wrap="truncate">{char}</Text>
      </Box>
      <Text color={t.fgDim} wrap="truncate">{label}</Text>
    </Box>
  );
}

/** An inverse-video key chip — the TUI "button"/active treatment. */
function KeyChip({ k, accent = false }: { k: string; accent?: boolean }): React.ReactElement {
  const t = useTokens();
  return accent ? (
    <Text color={t.fgInverse} backgroundColor={t.accent}>{' ' + k + ' '}</Text>
  ) : (
    <Text color={t.fgInverse} backgroundColor={t.bgInverse}>{' ' + k + ' '}</Text>
  );
}

/** A small non-flexing pane demoing a Pane tone (and the legacy square shape). */
function BorderSpecimen({
  label,
  tone,
  square = false,
}: {
  label: string;
  tone: 'resting' | 'focus' | 'error';
  square?: boolean;
}): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  return (
    <Pane title={label} tone={tone} variant={square ? 'square' : undefined} flexGrow={0}>
      <Text color={t.fgDim} wrap="truncate">
        {tone === 'error' ? (
          <Text>
            <Text color={t.stateErr}>{g('cross')}</Text>
            {' error · red'}
          </Text>
        ) : tone === 'focus' ? (
          <Text>
            <Text color={t.accent}>{g('focus')}</Text>
            {' focus · lavender'}
          </Text>
        ) : square ? (
          'square · legacy'
        ) : (
          'resting · muted'
        )}
      </Text>
    </Pane>
  );
}

// ── THEME · the one switch ─────────────────────────────────────────────────────

/** The live theme picker — built from the kit's own vocabulary (focus arrow +
 *  checkbox + inverse), calling the single owner `setTheme`. No per-component
 *  colour; switching repaints the whole page from the intent layer. */
function ThemePicker(): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  const { themeId, themes } = useThemeControls();
  return (
    <Box flexDirection="column">
      {themes.map((th) => {
        const on = th.id === themeId;
        // Fixed-width Boxes per column so rows stay grid-aligned: the selection
        // glyph reserves 2 cells (☑ is double-wide while ☐ is single), matching
        // how List sizes its checkbox column.
        return (
          <Box key={th.id} flexDirection="row">
            <Box width={1} flexShrink={0}>
              <Text color={t.accent}>{on ? g('focus') : ' '}</Text>
            </Box>
            <Box width={2} flexShrink={0} marginLeft={1}>
              <Text color={on ? t.accent : t.fgDim}>{on ? g('checkboxOn') : g('checkboxOff')}</Text>
            </Box>
            <Box width={13} flexShrink={0} marginLeft={1}>
              <Text color={on ? t.fg : t.fgMuted} wrap="truncate">{th.label}</Text>
            </Box>
            <Box width={6} flexShrink={0}>
              <Text color={t.fgFaint} wrap="truncate">{th.mode}</Text>
            </Box>
            <Text color={t.fgDim} wrap="truncate">{th.blurb}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

const DOMAIN_DOTS: Array<keyof SemanticTokens> = [
  'domainBlue', 'domainAzure', 'domainCyan', 'domainGreen',
  'domainAmber', 'domainYellow', 'domainViolet', 'domainRed',
];

/** A live specimen of the active theme — states, accent, domain hues, chrome. */
function ThemeSpecimen(): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  return (
    <Box flexDirection="column">
      <Box>
        <Box width={8} flexShrink={0}><Text color={t.fgDim}>state</Text></Box>
        <Text color={t.stateOk}>{g('check') + '  '}</Text>
        <Text color={t.stateErr}>{g('cross') + '  '}</Text>
        <Text color={t.statePending}>{g('circle') + '  '}</Text>
        <Text color={t.stateDrift}>{g('half') + '  '}</Text>
        <Text color={t.stateWarn}>{g('warn') + '  '}</Text>
        <Text color={t.stateInfo}>{g('rerun')}</Text>
      </Box>
      <Box>
        <Box width={8} flexShrink={0}><Text color={t.fgDim}>accent</Text></Box>
        <KeyChip k="focus" accent />
        <Text color={t.accent}>{'   ' + g('focus') + ' selected'}</Text>
      </Box>
      <Box>
        <Box width={8} flexShrink={0}><Text color={t.fgDim}>domain</Text></Box>
        {DOMAIN_DOTS.map((d) => (
          <Text key={d} color={t[d]}>{'● '}</Text>
        ))}
      </Box>
      <Box>
        <Box width={8} flexShrink={0}><Text color={t.fgDim}>link</Text></Box>
        <Text color={t.link}>{g('depends') + ' reference'}</Text>
        <Text color={t.highlight}>{'   match'}</Text>
      </Box>
    </Box>
  );
}

function ThemeSection(): React.ReactElement {
  const t = useTokens();
  const { theme } = useThemeControls();
  return (
    <Box flexDirection="column">
      <SectionTitle title="THEME" sub="one switch · owned by the surface · every component recolours from intent, never per component" />
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="select" tone="focus" flexGrow={0}>
            <ThemePicker />
            <Text> </Text>
            <Text color={t.fgFaint} wrap="truncate">{'t / T switch — the whole page repaints from the intent layer'}</Text>
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title={'live · ' + theme.label} flexGrow={0}>
            <ThemeSpecimen />
          </Pane>
        </Box>
      </Box>
    </Box>
  );
}

// ── COLOUR ──────────────────────────────────────────────────────────────────

const SURFACES = ['crust', 'mantle', 'base', 'surface0', 'surface1', 'surface2'] as const;
const TEXT_TIERS: Array<[keyof SemanticTokens, string]> = [
  ['fg', 'default body'],
  ['fgMuted', 'secondary'],
  ['fgDim', 'tertiary / hints'],
  ['fgFaint', 'labels / captions'],
  ['fgDisabled', 'separators'],
];
const ACCENT_HUES = [
  'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach',
  'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender',
] as const;
const SEMANTIC: Array<[keyof SemanticTokens, string, string]> = [
  ['stateOk', '--state-ok', '✓ installed / done'],
  ['stateErr', '--state-err', '✗ missing / failed'],
  ['stateWarn', '--state-warn', '⚠ warning'],
  ['statePending', '--state-pending', '◯ pending'],
  ['stateDrift', '--state-drift', '◐ drift / partial'],
  ['stateInfo', '--state-info', '↻ info / rerun'],
  ['accent', '--accent', 'focus · brand · primary'],
  ['accentAlt', '--accent-alt', 'secondary brand'],
  ['link', '--link', 'links / refs'],
  ['highlight', '--highlight', 'search match'],
  ['border', '--border', 'resting pane border'],
  ['borderFocus', '--border-focus', 'focused pane border'],
];

function ColourSection(): React.ReactElement {
  const t = useTokens();
  const { theme } = useThemeControls();
  const pal = theme.palette;
  return (
    <Box flexDirection="column">
      <SectionTitle title="COLOUR" sub="26-slot palette · swatches read the live theme · semantic colour lives on glyphs, never body text" />
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="surfaces" flexGrow={0}>
            {SURFACES.map((n) => (
              <Box key={n}>
                <Text backgroundColor={pal[n]} color={t.fg}>{(' ' + n).padEnd(10)}</Text>
                <Text color={t.fgDim}>{' ' + pal[n]}</Text>
              </Box>
            ))}
            <Text color={t.fgFaint} wrap="truncate">panels share the bg — split by border glyphs</Text>
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="text tiers" flexGrow={0}>
            {TEXT_TIERS.map(([tok, role]) => (
              <Text key={tok} color={t[tok]} wrap="truncate">{'● ' + tok + ' — ' + role}</Text>
            ))}
            <Text color={t.fgFaint} wrap="truncate">three greys max — then an accent</Text>
          </Pane>
        </Box>
      </Box>
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="accents · 14 hues" flexGrow={0}>
            <Box flexWrap="wrap">
              {ACCENT_HUES.map((n) => (
                <Box key={n} width={12} flexShrink={0}>
                  <Text color={pal[n]}>{'● '}</Text>
                  <Text color={t.fgDim} wrap="truncate">{n}</Text>
                </Box>
              ))}
            </Box>
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="semantic tokens" flexGrow={0}>
            {SEMANTIC.map(([tok, label, role]) => (
              <Box key={label}>
                <Text color={t[tok]}>{'● '}</Text>
                <Box width={16} flexShrink={0}><Text color={t.fg} wrap="truncate">{label}</Text></Box>
                <Text color={t.fgDim} wrap="truncate">{role}</Text>
              </Box>
            ))}
          </Pane>
        </Box>
      </Box>
    </Box>
  );
}

// ── TYPE ──────────────────────────────────────────────────────────────────────

function TypeSection(): React.ReactElement {
  const t = useTokens();
  return (
    <Box flexDirection="column">
      <SectionTitle title="TYPE" sub="one family · one size · one weight (400) · bold = inverse video" />
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="family" flexGrow={0}>
            <Text color={t.fg}>CaskaydiaMono Nerd Font</Text>
            <Text color={t.fgDim}>abcdefghijklmnopqrstuvwxyz 0123456789</Text>
            <Text color={t.fgDim}>{'{ } [ ] ( ) < > / \\ | = + - * & % $ #'}</Text>
            <Text color={t.fgFaint} wrap="truncate">tracking 0 · ligatures off · no italics</Text>
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="bold = inverse video" flexGrow={0}>
            <Box>
              <Text color={t.fgInverse} backgroundColor={t.bgInverse}>{' inverse video '}</Text>
              <Text color={t.fgDim}>{' is the only "bold"'}</Text>
            </Box>
            <Text> </Text>
            <Text color={t.fgFaint}>active hotkeys</Text>
            <Box gap={1}>
              <KeyChip k="TAB" />
              <KeyChip k="ENTER" />
              <KeyChip k="?" accent />
            </Box>
          </Pane>
        </Box>
      </Box>
    </Box>
  );
}

// ── GLYPHS · contract (tier 0) ─────────────────────────────────────────────────

const STATE_LEGEND: Array<{ name: string; token: keyof SemanticTokens; meaning: string }> = [
  { name: 'check', token: 'stateOk', meaning: 'installed / done' },
  { name: 'cross', token: 'stateErr', meaning: 'missing / failed' },
  { name: 'circle', token: 'statePending', meaning: 'pending' },
  { name: 'half', token: 'stateDrift', meaning: 'drift / partial' },
  { name: 'warn', token: 'stateWarn', meaning: 'warning' },
  { name: 'rerun', token: 'stateInfo', meaning: 'idempotent / refresh' },
];
const SEL_LEGEND: Array<{ name: string; token: keyof SemanticTokens; meaning: string }> = [
  { name: 'checkboxOn', token: 'accent', meaning: 'selected' },
  { name: 'checkboxOff', token: 'fgDim', meaning: 'unselected' },
  { name: 'checkboxLock', token: 'fgMuted', meaning: 'selected · locked' },
];
const NAV_LEGEND = ['focus', 'collapsed', 'expanded', 'depends', 'flow', 'back', 'moreAbove', 'moreBelow'];

function ContractSection(): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  return (
    <Box flexDirection="column">
      <SectionTitle title="GLYPHS · CONTRACT" sub="tier 0 · always present · never change · the framework owns glyph + colour" />
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="state" flexGrow={0}>
            {STATE_LEGEND.map((r) => (
              <Box key={r.name}>
                <Box width={2} flexShrink={0}><Text color={t[r.token]}>{g(r.name)}</Text></Box>
                <Box width={11} flexShrink={0}><Text color={t.fg} wrap="truncate">{r.name}</Text></Box>
                <Text color={t.fgDim} wrap="truncate">{r.meaning}</Text>
              </Box>
            ))}
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="selection" flexGrow={0}>
            {SEL_LEGEND.map((r) => (
              <Box key={r.name}>
                <Box width={2} flexShrink={0}><Text color={t[r.token]}>{g(r.name)}</Text></Box>
                <Box width={13} flexShrink={0}><Text color={t.fg} wrap="truncate">{r.name}</Text></Box>
                <Text color={t.fgDim} wrap="truncate">{r.meaning}</Text>
              </Box>
            ))}
          </Pane>
        </Box>
      </Box>
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="navigation" flexGrow={0}>
            <Box flexWrap="wrap">
              {NAV_LEGEND.map((n) => (
                <GlyphCell key={n} name={n} label={n} color={t.fgMuted} width={16} />
              ))}
            </Box>
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="box · blocks" flexGrow={0}>
            <Text color={t.border}>{'╭───────╮  ┌───────┐'}</Text>
            <Text color={t.border}>{'│rounded│  │square │'}</Text>
            <Text color={t.border}>{'╰───────╯  └───────┘'}</Text>
            <Text color={t.fgDim}>{'tees ├ ┤ ┬ ┴ ┼   ' + blocks.full + ' ' + blocks.dark + ' ' + blocks.medium + ' ' + blocks.light}</Text>
            <Box>
              <ProgressBar value={0.62} width={18} />
              <Text color={t.fgDim}>{' 62%'}</Text>
            </Box>
          </Pane>
        </Box>
      </Box>
    </Box>
  );
}

// ── GLYPHS · categories (tier 1 + 2) ───────────────────────────────────────────

function PackGrid({ name, pack }: { name: string; pack: Record<string, GlyphVariants> }): React.ReactElement {
  const t = useTokens();
  const names = Object.keys(pack);
  return (
    <Box flexDirection="column">
      <Text color={t.fgFaint}>
        {name}
        <Text color={t.fgDim}>{' · ' + names.length}</Text>
      </Text>
      <Box flexWrap="wrap">
        {names.map((n) => {
          const e = pack[n]!;
          // pack entries store a token key in `color`; resolve through the theme.
          const tok = (e.color ?? 'fgMuted') as keyof SemanticTokens;
          return <PackCell key={n} char={e.nerd} label={n} color={t[tok]} />;
        })}
      </Box>
    </Box>
  );
}

function CategorySection(): React.ReactElement {
  const t = useTokens();
  return (
    <Box flexDirection="column">
      <SectionTitle title="GLYPHS · CATEGORIES" sub="tier 1 + 2 · curated packs · opt in with registerGlyphs(PACK) · take only what you use" />
      <Pane title="domain packs" flexGrow={0}>
        <PackGrid name="common (tier 1)" pack={COMMON_DOMAINS} />
        {Object.keys(GLYPH_PACKS).map((cat) => (
          <PackGrid key={cat} name={cat} pack={GLYPH_PACKS[cat]!} />
        ))}
        <Text color={t.fgFaint} wrap="truncate">each entry: codepoint + unicode + ascii fallback + a semantic colour token</Text>
      </Pane>
    </Box>
  );
}

// ── COMPONENTS ──────────────────────────────────────────────────────────────

const INV_ROWS: ListRowData[] = [
  { id: 'pg', domain: 'postgresql', state: 'installed', selected: true, label: 'postgres@14.10', meta: ':5432' },
  { id: 'redis', domain: 'redis', state: 'ok', selected: true, label: 'redis@7.2', meta: ':6379' },
  { id: 'docker', domain: 'docker', state: 'pending', selected: false, label: 'docker', meta: '28 ctr' },
  { id: 'nginx', domain: 'ubuntu', state: 'drift', selected: false, label: 'nginx', meta: 'drift' },
  { id: 'node', domain: 'nodejs', state: 'ok', locked: true, label: 'node · api', meta: ':3000' },
  { id: 'graf', domain: 'database', state: 'missing', selected: false, label: 'grafana', meta: 'missing' },
  { id: 'ssh', domain: 'ssh', state: 'ok', selected: false, label: 'ssh-agent', meta: '3 keys' },
];

const DETAIL_ITEMS: DescriptionItem[] = [
  { value: 'postgres@14.10' },
  { value: 'the focused row, expanded', muted: true },
  { term: 'state', state: 'installed', value: 'running' },
  { term: 'path', value: 'data/pg/main' },
  { term: 'port', value: '5432' },
  { term: 'requires', value: '↳ redis' },
];

function ComponentSection(): React.ReactElement {
  const t = useTokens();
  return (
    <Box flexDirection="column">
      <SectionTitle title="COMPONENTS · CHROME" sub="Header · Footer · the frame every blink screen inherits" />
      <Pane title="Header" flexGrow={0}>
        <Header mark={blocks.cursor} title="blink" subtitle="screen title" right={'✓ 4  ◐ 1  ✗ 1'} />
      </Pane>
      <Pane title="Footer" flexGrow={0}>
        <Footer
          keys={[{ k: 'tab', desc: 'pane' }, { k: '↵', desc: 'open' }, { k: '/', desc: 'search' }, { k: 'q', desc: 'quit' }]}
          right="6 of 8"
        />
      </Pane>

      <SectionTitle title="COMPONENTS · PANES" sub="one shape — single-line rounded · emphasis is colour, never weight" />
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}><BorderSpecimen label="resting" tone="resting" /></Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}><BorderSpecimen label="focus" tone="focus" /></Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}><BorderSpecimen label="error" tone="error" /></Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}><BorderSpecimen label="square" tone="resting" square /></Box>
      </Box>

      <SectionTitle title="COMPONENTS · DATA" sub="List · DescriptionList · intent-only rows (state + domain NAMES), framework paints them" />
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="List ‹windowed›" flexGrow={0}>
            <List rows={INV_ROWS} focusedId="docker" selectedIds={new Set(['pg', 'redis'])} height={5} />
            <Text color={t.fgFaint} wrap="truncate">{'▶ focus · ☑/☐/▣ · state · domain · ▴▾ overflow'}</Text>
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="DescriptionList" flexGrow={0}>
            <DescriptionList items={DETAIL_ITEMS} gutter={9} />
          </Pane>
        </Box>
      </Box>

      <SectionTitle title="COMPONENTS · INPUT" sub="single-line field · ▎ cursor blinks · border recolours by tone" />
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="states" flexGrow={0}>
            <Input title="host" value="db.internal:5432" />
            <Text> </Text>
            <Input title="filter" value="postgr" focused />
            <Text> </Text>
            <Input title="token" value="" placeholder="paste token" error="required — field is empty" />
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="Banner ‹in-flow notice›" flexGrow={0}>
            <Banner tone="info">depends on web/valet — auto-selected</Banner>
            <Banner tone="success">connected · postgres@14.10</Banner>
            <Banner tone="warn">nginx config out-of-date — press a to apply</Banner>
            <Text color={t.fgFaint} wrap="truncate">colour on the leading glyph only · text stays calm</Text>
          </Pane>
        </Box>
      </Box>

      <SectionTitle title="COMPONENTS · DIALOG" sub="a focused (lavender) rounded pane that overlays · error recolours red · no blur, no fade" />
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Dialog
            title="delete process"
            width={42}
            lines={['remove this process from the host?', '↳ grafana']}
            actions={[{ key: 'N', label: 'keep', primary: true }, { key: 'y', label: 'delete' }]}
          />
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Dialog
            title="error"
            tone="error"
            width={42}
            lines={['✗ grafana — port in use', 'another process is bound to this port']}
            actions={[{ key: '↵', label: 'dismiss', primary: true }, { key: 'l', label: 'view log' }]}
          />
        </Box>
      </Box>
    </Box>
  );
}

// ── MOTION ──────────────────────────────────────────────────────────────────

function MotionSection({ interactive }: { interactive: boolean }): React.ReactElement {
  const t = useTokens();
  const g = useGlyph();
  return (
    <Box flexDirection="column">
      <SectionTitle title="MOTION" sub="two sanctioned motions · both character-level · no transition / transform / easing" />
      <Box flexDirection="row">
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="spinner ‹80ms›" flexGrow={0}>
            <Box>
              <Spinner active={interactive} />
              <Text color={t.stateInfo}>{' syncing  '}</Text>
              <Text color={t.fgDim}>3/12</Text>
            </Box>
            <Text color={t.fgDim}>{'⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏'}</Text>
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="cursor ‹1Hz›" flexGrow={0}>
            <Box>
              <Text color={t.fg}>prompt </Text>
              <Cursor active={interactive} />
            </Box>
            <Text color={t.fgFaint} wrap="truncate">blinks at 1 Hz, no fade — the heart of the brand</Text>
          </Pane>
        </Box>
        <Box flexBasis={0} flexGrow={1} minWidth={0}>
          <Pane title="counter + progress" flexGrow={0}>
            <Box>
              <Text color={t.stateInfo}>{g('rerun') + ' applying  '}</Text>
              <Text color={t.fgDim}>8/13</Text>
            </Box>
            <Box>
              <ProgressBar value={0.62} width={16} />
              <Text color={t.fgDim}>{' 62%'}</Text>
            </Box>
          </Pane>
        </Box>
      </Box>
    </Box>
  );
}

// ── the page ──────────────────────────────────────────────────────────────────

function App({
  interactive = true,
  onExit,
}: {
  interactive?: boolean;
  onExit?: () => void;
} = {}): React.ReactElement {
  const t = useTokens();
  const { exit } = useApp();
  const leave = onExit ?? exit;
  const leaveLabel = onExit ? 'menu' : 'quit';
  const { rows } = useStdoutDimensions();
  const { theme, themeId, setTheme, themes } = useThemeControls();

  const [scroll, setScroll] = useState(0);
  const [help, setHelp] = useState(false);

  // The viewport is an EXPLICIT height (the whole screen minus the 1-row Header
  // and 1-row Footer). A flex-grown box can't bound a taller-than-itself child
  // under overflow:hidden in Ink — it expands to the child and overlaps the
  // chrome. A fixed height clips correctly; we scroll by offsetting the content.
  const totalH = Math.max(1, rows - 1);
  // header (1) + footer (its 1-cell top margin + 1-cell bar = 2) = 3 rows of chrome.
  const viewportH = Math.max(1, totalH - 3);

  const contentRef = useRef<DOMElement>(null);
  const [ch, setCh] = useState(0);
  const maxScrollRef = useRef(0);

  useEffect(() => {
    if (contentRef.current) {
      const m = measureElement(contentRef.current);
      if (m.height && m.height !== ch) setCh(m.height);
    }
  });

  const maxScroll = Math.max(0, ch - viewportH);
  maxScrollRef.current = maxScroll;
  const offset = CLAMP(scroll, 0, maxScroll);

  const themeIdx = Math.max(0, themes.findIndex((th) => th.id === themeId));
  const cycleTheme = (dir: 1 | -1): void => {
    const next = (themeIdx + dir + themes.length) % themes.length;
    setTheme(themes[next]!.id);
  };

  useInput(
    (input, key) => {
      if (help) {
        if (key.escape || key.return || input === '?') setHelp(false);
        return;
      }
      const page = Math.max(1, viewportH - 1);
      if (key.downArrow || input === 'j') setScroll((s) => CLAMP(s + 1, 0, maxScrollRef.current));
      else if (key.upArrow || input === 'k') setScroll((s) => CLAMP(s - 1, 0, maxScrollRef.current));
      else if (input === ' ' || key.pageDown) setScroll((s) => CLAMP(s + page, 0, maxScrollRef.current));
      else if (input === 'b' || key.pageUp) setScroll((s) => CLAMP(s - page, 0, maxScrollRef.current));
      else if (input === 'g') setScroll(0);
      else if (input === 'G') setScroll(maxScrollRef.current);
      else if (input === 't') cycleTheme(1);
      else if (input === 'T') cycleTheme(-1);
      else if (input === '?') setHelp(true);
      else if (input === 'q') leave();
    },
    { isActive: interactive },
  );

  const atTop = offset <= 0;
  const atBottom = offset >= maxScroll;

  return (
    <Box flexDirection="column" height={totalH}>
      <Header
        mark={<Cursor active={interactive} />}
        title="blink"
        subtitle="inventory"
        right={
          <Box>
            <Spinner active={interactive} />
            <Text color={t.fgMuted}>{' every token · glyph · component'}</Text>
          </Box>
        }
      />

      {help ? (
        <Box flexGrow={1} minHeight={0}>
          <Dialog
            title="keys"
            width={48}
            lines={[
              '↑ ↓ / j k   scroll        spc / b   page',
              'g / G       top / bottom  t / T     theme',
              '?           this help     q         ' + leaveLabel,
            ]}
            actions={[{ key: '?', label: 'close', primary: true }]}
          />
        </Box>
      ) : (
        <Box height={viewportH} overflow="hidden" flexDirection="column">
          <Box ref={contentRef} flexDirection="column" flexShrink={0} marginTop={-offset}>
            <ThemeSection />
            <ColourSection />
            <TypeSection />
            <ContractSection />
            <CategorySection />
            <ComponentSection />
            <MotionSection interactive={interactive} />
            <Text color={t.fgFaint}>{"— if you can't draw it with characters, it doesn't belong in a blink app —"}</Text>
          </Box>
        </Box>
      )}

      <Footer
        keys={
          help
            ? [{ k: '?', desc: 'close' }]
            : [
                { k: '↑↓', desc: 'scroll' },
                { k: 'spc', desc: 'page' },
                { k: 't', desc: 'theme' },
                { k: '?', desc: 'keys' },
                { k: 'q', desc: leaveLabel },
              ]
        }
        right={`theme · ${theme.label}${atTop ? '' : atBottom ? ' · end' : ' · ' + Math.round((offset / Math.max(1, maxScroll)) * 100) + '%'}`}
      />
    </Box>
  );
}

const invokedDirectly = Boolean(process.argv[1] && /showcase\.(tsx|js)$/.test(process.argv[1]));

if (invokedDirectly && process.env.BLINK_DEMO_SNAPSHOT === '1') {
  // Static snapshot: one non-interactive frame at the 100×30 design target,
  // showing the top of the scrolling inventory.
  const frames: string[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      frames.push(chunk.toString());
      cb();
    },
  }) as Writable & { columns: number; rows: number; isTTY?: boolean };
  sink.columns = 100;
  sink.rows = 31;
  const iconSet = await detectIconSet();
  const instance = render(
    <ThemeProvider iconSet={iconSet}>
      <App interactive={false} />
    </ThemeProvider>,
    { stdout: sink as unknown as NodeJS.WriteStream, patchConsole: false },
  );
  setTimeout(() => {
    instance.unmount();
    process.stdout.write((frames.at(-1) ?? frames.join('')) + '\n');
    process.exit(0);
  }, 250);
} else if (invokedDirectly) {
  const iconSet = await detectIconSet();
  const instance = render(
    <ThemeProvider iconSet={iconSet}>
      <App />
    </ThemeProvider>,
  );
  const exitMs = Number(process.env.BLINK_DEMO_EXIT_MS);
  if (Number.isFinite(exitMs) && exitMs > 0) {
    setTimeout(() => instance.unmount(), exitMs);
  }
}

export { App };

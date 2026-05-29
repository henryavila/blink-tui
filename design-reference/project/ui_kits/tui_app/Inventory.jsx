// Inventory.jsx — the blink GLOBAL INVENTORY: every colour, token, glyph tier,
// glyph category, selection state and component primitive on one scrollable
// page. Documentation surface — composes the real kit primitives and reads the
// real glyph data (glyph-packs.js / glyph-index.js), so it can never drift from
// the framework. Obeys the blink contract throughout: monospace, glyph borders,
// no CSS border/radius/shadow/transition, semantic colour on glyphs.

const { useState, useEffect } = React;
const CELLH = "var(--cell-h)";

// ── live theme plumbing ───────────────────────────────────────────────────────
// Read a CSS custom property's resolved value off the root surface. Because the
// theme is set there, this returns the ACTIVE theme's colour — no hardcoded hex.
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
// Re-render the page when the theme switches so live swatches re-read cssVar().
function useThemeTick() {
  const [, force] = useState(0);
  useEffect(() => BlinkTheme.onTheme(() => force((x) => x + 1)), []);
}

// ── shared chrome ─────────────────────────────────────────────────────────────
function useSpinner(ms = 80) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SPINNER.length), ms);
    return () => clearInterval(t);
  }, [ms]);
  return SPINNER[i];
}

function InvPane({ title, tone, children }) {
  return <Pane title={title} tone={tone} flex="0 0 auto">{children}</Pane>;
}

function Section({ title, sub, full, wide, children }) {
  return (
    <div className="inv-section">
      <div className="inv-sechead"><span className="inv-secn">{title}</span>{sub ? <span className="inv-secsub">{"  " + sub}</span> : null}</div>
      <div className={"inv-grid" + (full ? " full" : "") + (wide ? " wide" : "")}>{children}</div>
    </div>
  );
}

// ── THEME · the one switch ──────────────────────────────────────────────────────
// A TUI-native theme picker built from the kit's OWN vocabulary: focus arrow,
// checkbox glyph, inverse video — the same primitives the List/Footer use. It
// calls BlinkTheme.setTheme(), the single owner. No per-component colour.
function ThemeRows() {
  const cur = BlinkTheme.getTheme();
  return (
    <div>
      {BlinkTheme.THEMES.map((t) => {
        const on = t.id === cur;
        return (
          <div key={t.id}
            className={"inv-themerow" + (on ? " on" : "")}
            onClick={() => BlinkTheme.setTheme(t.id)}
            title={"switch to " + t.label}
            style={{ display: "flex", alignItems: "baseline", gap: "1ch",
                     whiteSpace: "pre", lineHeight: CELLH, cursor: "pointer", padding: "0 1ch" }}>
            <span style={{ color: "var(--accent)", width: "1ch", flexShrink: 0 }}>{on ? NAV.focus : " "}</span>
            <span style={{ color: on ? "var(--accent)" : "var(--fg-dim)", width: "2ch", flexShrink: 0 }}>{on ? STATE.checkboxOn : STATE.checkboxOff}</span>
            <span style={{ color: on ? "var(--fg)" : "var(--fg-muted)", width: "11ch", flexShrink: 0 }}>{t.label}</span>
            <span style={{ color: "var(--fg-faint)", width: "6ch", flexShrink: 0 }}>{t.mode}</span>
            <span style={{ color: "var(--fg-dim)", overflow: "hidden", textOverflow: "clip" }}>{t.blurb}</span>
          </div>
        );
      })}
    </div>
  );
}

const DOMAIN_DOTS = ["--domain-blue", "--domain-azure", "--domain-cyan", "--domain-green",
                     "--domain-amber", "--domain-yellow", "--domain-violet", "--domain-red"];

function ThemeSpecimen() {
  return (
    <div>
      <div className="inv-line"><span className="inv-dim">{"state   "}</span>
        <span style={{ color: "var(--state-ok)" }}>{STATE.check}</span>{"  "}
        <span style={{ color: "var(--state-err)" }}>{STATE.cross}</span>{"  "}
        <span style={{ color: "var(--state-pending)" }}>{STATE.circle}</span>{"  "}
        <span style={{ color: "var(--state-drift)" }}>{STATE.half}</span>{"  "}
        <span style={{ color: "var(--state-warn)" }}>{STATE.warn}</span>{"  "}
        <span style={{ color: "var(--state-info)" }}>{STATE.rerun}</span>
      </div>
      <div className="inv-line"><span className="inv-dim">{"accent  "}</span>
        <span className="inverse-accent" style={{ padding: "0 1ch" }}>focus</span>{"   "}
        <span style={{ color: "var(--accent)" }}>{NAV.focus} selected</span>
      </div>
      <div className="inv-line"><span className="inv-dim">{"domain  "}</span>
        {DOMAIN_DOTS.map((d) => <span key={d} style={{ color: "var(" + d + ")" }}>{"● "}</span>)}
      </div>
      <div className="inv-line"><span className="inv-dim">{"link    "}</span>
        <span style={{ color: "var(--link)" }}>{NAV.depends} reference</span>{"   "}
        <span style={{ color: "var(--highlight)" }}>match</span>
      </div>
      <div style={{ height: CELLH }} />
      <Pane title="focused pane" tone="focus" flex="0 0 auto">
        <div className="inv-line" style={{ color: "var(--accent)" }}>{NAV.focus + " the focused row"}</div>
        <div className="inv-line inv-dim">{"  a resting line below"}</div>
      </Pane>
    </div>
  );
}

function ThemeSection() {
  const cur = BlinkTheme.getThemeMeta();
  return (
    <Section title="THEME" sub="one switch · owned by the terminal surface (theme.js) · every component recolours from intent — never per component" wide>
      <InvPane title="select">
        <ThemeRows />
        <div className="inv-cap">click a theme — the whole page repaints from the intent layer, and the choice persists across reloads. components own no colour, so none can diverge.</div>
      </InvPane>
      <InvPane title={"live · " + cur.label}>
        <ThemeSpecimen />
      </InvPane>
    </Section>
  );
}


// ── COLOUR ────────────────────────────────────────────────────────────────────
// Token NAMES only — the hex shown is read live from the active theme.
const SURFACES = ["crust", "mantle", "base", "surface0", "surface1", "surface2"];
const TEXT_TIERS = [
  ["text",     "--fg · default body"],
  ["subtext1", "--fg-muted · secondary"],
  ["subtext0", "--fg-dim · tertiary / hints"],
  ["overlay1", "--fg-faint · labels / captions"],
  ["overlay0", "--fg-disabled · separators"],
];
const ACCENTS = [
  "rosewater", "flamingo", "pink", "mauve", "red", "maroon", "peach",
  "yellow", "green", "teal", "sky", "sapphire", "blue", "lavender",
];
const SEMANTIC = [
  ["--state-ok", "green", "✓ installed / done"],
  ["--state-err", "red", "✗ missing / failed"],
  ["--state-warn", "yellow", "⚠ warning"],
  ["--state-pending", "overlay1", "◯ pending"],
  ["--state-drift", "peach", "◐ drift / partial"],
  ["--state-info", "sky", "↻ info / rerun"],
  ["--accent", "lavender", "focus · brand · primary"],
  ["--accent-alt", "mauve", "secondary brand"],
  ["--link", "blue", "links / refs"],
  ["--highlight", "yellow", "search match"],
  ["--border", "surface1", "resting pane border"],
  ["--border-focus", "lavender", "focused pane border"],
];

function Swatches({ names }) {
  return (
    <div className="inv-swatches">
      {names.map((n) => (
        <div key={n} className="inv-swatch"
             style={{ background: "var(--ctp-" + n + ")", color: "var(--fg)" }}>
          <span className="inv-sw-n">{n}</span>
          <span className="inv-sw-h">{cssVar("--ctp-" + n)}</span>
        </div>
      ))}
    </div>
  );
}

function ColorSection() {
  return (
    <Section title="COLOUR" sub="26-slot palette · swatches read the LIVE theme · semantic colour lives on glyphs, never body text">
      <InvPane title="surfaces">
        <Swatches names={SURFACES} />
        <div className="inv-cap">panels share the bg — separated by border glyphs, not tonal contrast</div>
      </InvPane>
      <InvPane title="text tiers">
        {TEXT_TIERS.map(([n, role]) => (
          <div key={n} className="inv-line" style={{ color: "var(--ctp-" + n + ")" }}>{"● " + n + " — " + role}</div>
        ))}
        <div className="inv-cap">three greys max · beyond that, use an accent — never a fourth grey</div>
      </InvPane>
      <InvPane title="accents · 14 hues">
        <div className="inv-bullets">
          {ACCENTS.map((n) => (
            <span key={n} className="inv-bullet"><span style={{ color: "var(--ctp-" + n + ")" }}>●</span> {n}</span>
          ))}
        </div>
      </InvPane>
      <InvPane title="semantic tokens">
        {SEMANTIC.map(([tok, pal, role]) => (
          <div key={tok} className="inv-kv">
            <span style={{ color: "var(--ctp-" + pal + ")", width: "2ch", flexShrink: 0 }}>●</span>
            <span className="inv-tok">{tok}</span>
            <span className="inv-role">{role}</span>
          </div>
        ))}
      </InvPane>
    </Section>
  );
}

// ── TYPE ────────────────────────────────────────────────────────────────────
function TypeSection() {
  return (
    <Section title="TYPE" sub="one family · one size (14px) · one weight (400) · bold = inverse video">
      <InvPane title="family">
        <div className="inv-line">CaskaydiaMono Nerd Font</div>
        <div className="inv-line inv-dim">abcdefghijklmnopqrstuvwxyz 0123456789</div>
        <div className="inv-line inv-dim">{"{ } [ ] ( ) < > / \\ | = + - * & % $ #"}</div>
        <div className="inv-cap">tracking 0 · ligatures off · no italics · no variable axes</div>
      </InvPane>
      <InvPane title="bold = inverse video">
        <div className="inv-line"><span className="inverse" style={{ padding: "0 1ch" }}>inverse video</span> is the only “bold”</div>
        <div style={{ height: CELLH }} />
        <div className="inv-cap">active hotkeys</div>
        <KeyChips chips={[{ k: "TAB" }, { k: "ENTER" }, { k: "?", accent: true }]} />
      </InvPane>
      <InvPane title="doc scale · mocks only">
        {[["12", "footnote"], ["13", "mobile-mosh"], ["14", "TUI body"], ["16", "zoom read"], ["20", "banner"], ["28", "splash"]].map(([px, role]) => (
          <div key={px} className="inv-line" style={{ fontSize: px + "px", lineHeight: 1.25 }}>{px}px — {role}</div>
        ))}
        <div className="inv-cap">live TUI screens hold at 14 — the scale is for HTML docs</div>
      </InvPane>
    </Section>
  );
}

// ── GLYPHS · contract (tier 0) ────────────────────────────────────────────────
const STATE_LEGEND = [
  { glyph: STATE.check,  color: "var(--state-ok)",      name: "check",        meaning: "installed / done" },
  { glyph: STATE.cross,  color: "var(--state-err)",     name: "cross",        meaning: "missing / failed" },
  { glyph: STATE.circle, color: "var(--state-pending)", name: "circle",       meaning: "pending" },
  { glyph: STATE.half,   color: "var(--state-drift)",   name: "half",         meaning: "drift / partial" },
  { glyph: STATE.warn,   color: "var(--state-warn)",    name: "warn",         meaning: "warning" },
  { glyph: STATE.rerun,  color: "var(--state-info)",    name: "rerun",        meaning: "idempotent / refresh" },
];
const SEL_LEGEND = [
  { glyph: STATE.checkboxOn,   color: "var(--accent)",   name: "checkbox-on",   meaning: "selected" },
  { glyph: STATE.checkboxOff,  color: "var(--fg-dim)",   name: "checkbox-off",  meaning: "unselected" },
  { glyph: STATE.checkboxLock, color: "var(--fg-muted)", name: "checkbox-lock", meaning: "selected · locked (required)" },
];
const NAV_LEGEND = [
  { glyph: NAV.focus,     name: "focus",      meaning: "left of focused row" },
  { glyph: NAV.collapsed, name: "collapsed",  meaning: "expandable, closed" },
  { glyph: NAV.expanded,  name: "expanded",   meaning: "expandable, open" },
  { glyph: NAV.depends,   name: "depends",    meaning: "dependency / consequence" },
  { glyph: NAV.flow,      name: "flow",       meaning: "next step" },
  { glyph: NAV.back,      name: "back",       meaning: "previous / return" },
  { glyph: NAV.moreAbove, name: "more-above", meaning: "rows hidden above" },
  { glyph: NAV.moreBelow, name: "more-below", meaning: "rows hidden below" },
];

function Legend({ rows }) {
  return (
    <div className="inv-legend">
      {rows.map((r, i) => (
        <div key={i} className="inv-legrow">
          <span className="g" style={{ color: r.color || "var(--fg-muted)" }}>{r.glyph}</span>
          <span className="n">{r.name}</span>
          <span className="m">{r.meaning}</span>
        </div>
      ))}
    </div>
  );
}

function ContractSection() {
  return (
    <Section title="GLYPHS · CONTRACT" sub="tier 0 · always present · never change · the framework owns glyph + colour">
      <InvPane title="state"><Legend rows={STATE_LEGEND} /></InvPane>
      <InvPane title="selection"><Legend rows={SEL_LEGEND} /></InvPane>
      <InvPane title="navigation"><Legend rows={NAV_LEGEND} /></InvPane>
      <InvPane title="box-drawing">
        <div className="inv-box">
          <div>{"╭───────────╮   ┌───────────┐"}</div>
          <div>{"│ rounded   │   │ square     │"}</div>
          <div>{"│ (house)   │   │ (legacy)   │"}</div>
          <div>{"╰───────────╯   └───────────┘"}</div>
        </div>
        <div className="inv-line inv-dim" style={{ marginTop: "6px" }}>{"tees  ├ ┤ ┬ ┴ ┼     lines  ─ │"}</div>
        <div className="inv-cap">every border is a glyph · no CSS border / radius / outline</div>
      </InvPane>
      <InvPane title="blocks + progress">
        <div className="inv-line">{"█ full   ▓ dark   ▒ medium   ░ light"}</div>
        <div className="inv-line inv-dim">{"▁ ▂ ▄ ▆ █ partials      ▎ cursor"}</div>
        <div style={{ height: CELLH }} />
        <BlockBar pct={62} width={22} />
      </InvPane>
    </Section>
  );
}

// ── GLYPHS · categories (tier 1 + 2) ──────────────────────────────────────────
function PackGrid({ name, pack }) {
  const names = Object.keys(pack);
  return (
    <div className="inv-pack">
      <div className="inv-packhd">{name}<span className="inv-packn">{" · " + names.length}</span></div>
      <div className="inv-packgrid">
        {names.map((n) => {
          const e = pack[n];
          return (
            <span key={n} className="inv-gcell">
              <span className="g" style={{ color: e.color }}>{e.nerd}</span>
              <span className="l">{n}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function CategorySection() {
  return (
    <Section title="GLYPHS · CATEGORIES" sub="tier 1 + 2 · curated packs · opt in with registerGlyphs(PACK) · take only what you use" full>
      <InvPane title="domain packs">
        <PackGrid name="common (tier 1)" pack={COMMON_DOMAINS} />
        {Object.keys(GLYPH_PACKS).map((cat) => (
          <PackGrid key={cat} name={cat} pack={GLYPH_PACKS[cat]} />
        ))}
        <div className="inv-cap">each entry is fully curated — codepoint + unicode + ascii fallback + semantic colour</div>
      </InvPane>
    </Section>
  );
}

// ── GLYPHS · raw index (tier 3) ───────────────────────────────────────────────
function IndexSection() {
  const sample = Object.keys(NERD_INDEX).slice(0, 40);
  return (
    <Section title="GLYPHS · RAW INDEX" sub="tier 3 · whole Nerd Font, name→codepoint · no fallback, no colour — a deliberate escape hatch">
      <InvPane title="nf() escape hatch">
        <div className="inv-api">{"nf('fa-rocket')                  "}<span className="inv-dim">→ the glyph or ''</span></div>
        <div className="inv-api">{"registerGlyphs({ deploy: { nf: 'fa-rocket' } })"}</div>
        <div className="inv-cap">muted by default · ascii derived · promote to a curated pack for anything shown often</div>
        <div style={{ height: CELLH }} />
        <div className="inv-cap">seed shown · full ~10k generated from glyphnames.json, lazy-loaded · search all in 24-glyphs-picker</div>
      </InvPane>
      <InvPane title="sample">
        <div className="inv-idx">
          {sample.map((n) => (
            <span key={n} className="inv-icell"><span className="g">{nf(n)}</span><span className="l">{n}</span></span>
          ))}
        </div>
      </InvPane>
    </Section>
  );
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────
const INV_ROWS = [
  { id: "pg",    domain: "postgresql", state: "installed", selected: true,  label: "postgres@14.10", meta: ":5432" },
  { id: "redis", domain: "redis",      state: "ok",        selected: true,  label: "redis@7.2",      meta: ":6379" },
  { id: "docker",domain: "docker",     state: "pending",   selected: false, label: "docker",         meta: "28 ctr" },
  { id: "nginx", domain: "ubuntu",     state: "drift",     selected: false, label: "nginx",          meta: "drift" },
  { id: "node",  domain: "nodejs",     state: "ok",        locked: true,    label: "node · api",     meta: ":3000" },
  { id: "graf",  domain: "grafana",    state: "missing",   selected: false, label: "grafana",        meta: "missing" },
  { id: "ssh",   domain: "ssh",        state: "ok",        selected: false, label: "ssh-agent",      meta: "3 keys" },
];

function DialogBox({ children }) {
  return <div style={{ position: "relative", height: "150px", background: "var(--bg)" }}>{children}</div>;
}

function ComponentSection() {
  return (
    <React.Fragment>
      <Section title="COMPONENTS · CHROME" sub="Header · Footer · the frame every blink screen inherits">
        <InvPane title="Header">
          <Header mark={<span className="tui-cursor">▎</span>} title="blink" subtitle="screen title"
            right={<span>{"✓ 4  ◐ 1  ✗ 1"}</span>} />
          <div className="inv-cap">lavender mark · title · right status slot</div>
        </InvPane>
        <InvPane title="Footer">
          <Footer keys={[{ k: "tab", desc: "pane" }, { k: "↵", desc: "open" }, { k: "/", desc: "search" }, { k: "q", desc: "quit" }]} right="6 of 8" />
          <div className="inv-cap">always visible · keys in inverse video · one line</div>
        </InvPane>
      </Section>

      <Section title="COMPONENTS · PANES" sub="one shape — single-line rounded · emphasis is colour, never weight">
        <InvPane title="resting"><div className="inv-line inv-dim">{NAV.focus + " a pane at rest · muted border"}</div></InvPane>
        <BorderSpecimen label="focus" tone="focus" />
        <BorderSpecimen label="error" tone="error" />
        <BorderSpecimen label="square · legacy" shape="square" />
      </Section>

      <Section title="COMPONENTS · DATA" sub="List · DescriptionList · intent-only rows (state + domain NAMES), framework paints them">
        <InvPane title="List ‹windowed›">
          <List rows={INV_ROWS} focusedId="docker" selectedIds={new Set(["pg", "redis"])} height={5} />
          <div className="inv-cap">▶ focus · ☑/☐/▣ select · state · domain · label · meta · ▴▾ overflow</div>
        </InvPane>
        <InvPane title="DescriptionList">
          <DescriptionList items={[
            { value: "postgres@14.10" },
            { value: "the focused row, expanded", muted: true },
            { term: "state", state: "installed", value: "running" },
            { term: "path", value: "data/pg/main" },
            { term: "port", value: "5432" },
            { term: "requires", value: NAV.depends + " redis" },
          ]} />
        </InvPane>
      </Section>

      <Section title="COMPONENTS · INPUT" sub="single-line field · ▎ cursor blinks · border recolours by tone">
        <InvPane title="states">
          <Input title="host" value="db.internal:5432" />
          <div style={{ height: CELLH }} />
          <Input title="filter" value="postgr" focused={true} />
          <div style={{ height: CELLH }} />
          <Input title="token" value="" placeholder="paste token" error="required — field is empty" />
        </InvPane>
        <InvPane title="Banner ‹in-flow notice›">
          <Banner tone="info">↳ depends on web/valet — auto-selected</Banner>
          <Banner tone="success">connected · postgres@14.10</Banner>
          <Banner tone="warn">nginx config out-of-date — press a to apply</Banner>
          <div className="inv-cap">colour on the leading glyph only · text stays calm</div>
        </InvPane>
      </Section>

      <Section title="COMPONENTS · DIALOG" sub="a focused (lavender) rounded pane that overlays · error recolours red · no blur, no fade" wide>
        <InvPane title="confirm">
          <DialogBox>
            <Dialog title="delete process"
              lines={["remove this process from the host?", NAV.depends + " grafana"]}
              actions={[{ key: " N ", label: "keep", primary: true }, { key: "y", label: "delete" }]} />
          </DialogBox>
        </InvPane>
        <InvPane title="error">
          <DialogBox>
            <Dialog title="error" tone="error"
              lines={[STATE.cross + " grafana — port in use", "another process is bound to this port"]}
              actions={[{ key: " ↵ ", label: "dismiss", primary: true }, { key: "l", label: "view log" }]} />
          </DialogBox>
        </InvPane>
      </Section>
    </React.Fragment>
  );
}

// ── MOTION ────────────────────────────────────────────────────────────────────
function MotionSection() {
  const spin = useSpinner();
  return (
    <Section title="MOTION" sub="two sanctioned motions only · both character-level · no transition / transform / easing">
      <InvPane title="spinner ‹80ms›">
        <div className="inv-line" style={{ color: "var(--state-info)" }}>{spin + "  syncing  "}<span className="inv-dim">3/12</span></div>
        <div className="inv-line inv-dim">{"⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏"}</div>
      </InvPane>
      <InvPane title="cursor ‹1Hz step-end›">
        <div className="inv-line">{"prompt "}<span className="tui-cursor">▎</span></div>
        <div className="inv-cap">blinks at 1 Hz, no fade — the heart of the brand</div>
      </InvPane>
      <InvPane title="counter + progress">
        <div className="inv-line">{STATE.rerun + " applying  "}<span className="inv-dim">8/13</span></div>
        <BlockBar pct={62} width={20} />
        <div className="inv-cap">loading is a counter / block bar — never a CSS bar</div>
      </InvPane>
    </Section>
  );
}

// ── the page ──────────────────────────────────────────────────────────────────
function Inventory() {
  const spin = useSpinner();
  useThemeTick();
  const theme = BlinkTheme.getThemeMeta();
  return (
    <div className="inv-app">
      <Header mark={<span className="tui-cursor">▎</span>} title="blink" subtitle="inventory"
        right={<span style={{ whiteSpace: "pre" }}>{spin + " every token · glyph · component on one page"}</span>} />
      <div className="inv-scroll">
        <div className="inv-wrap">
          <ThemeSection />
          <ColorSection />
          <TypeSection />
          <ContractSection />
          <CategorySection />
          <IndexSection />
          <ComponentSection />
          <MotionSection />
          <div className="inv-end">{"— if you can't draw it with characters, it doesn't belong in a blink app —"}</div>
        </div>
      </div>
      <Footer keys={[{ k: "↑↓", desc: "scroll" }]} right={"theme · " + theme.label + " · the complete blink contract"} />
    </div>
  );
}

window.Inventory = Inventory;

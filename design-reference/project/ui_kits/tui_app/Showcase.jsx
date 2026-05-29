// Showcase.jsx — gallery sub-components for the blink component showcase.
// These compose the kit primitives (Pane/List/Input/Dialog/Footer) and the
// glyph constants into the small specimen blocks used on the showcase screen.
// Everything obeys the blink contract: flexbox only, glyph borders, no CSS
// border/radius/shadow/transition, one font, one size, one weight.

const CELL = "var(--cell-h)";

// A single labelled line: dim caption on the left, value on the right.
function KV({ k, v, kColor = "var(--fg-faint)", vColor = "var(--fg)", kw = "10ch" }) {
  return (
    <div style={{ display: "flex", whiteSpace: "pre", lineHeight: CELL }}>
      <span style={{ color: kColor, width: kw, flexShrink: 0 }}>{k}</span>
      <span style={{ color: vColor }}>{v}</span>
    </div>
  );
}

// One glyph + its name, coloured. Used in the glyph legends.
function GlyphCell({ g, name, color = "var(--fg)", w = "16ch" }) {
  return (
    <span style={{ display: "inline-flex", gap: "1ch", whiteSpace: "pre", width: w, lineHeight: CELL }}>
      <span style={{ color, width: "2ch", flexShrink: 0, textAlign: "center" }}>{g}</span>
      <span style={{ color: "var(--fg-dim)" }}>{name}</span>
    </span>
  );
}

// A horizontally-wrapping bank of glyph cells (flex wrap, cell-quantised gaps).
function GlyphBank({ items, w }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", rowGap: 0, columnGap: "1ch" }}>
      {items.map((it, i) => (
        <GlyphCell key={i} g={it.g} name={it.name} color={it.color} w={w} />
      ))}
    </div>
  );
}

// Progress bar drawn from block glyphs only — never a CSS bar.
function BlockBar({ pct, width = 22, color = "var(--accent)" }) {
  const filled = Math.round((pct / 100) * width);
  const bar = "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
  return (
    <div style={{ display: "flex", whiteSpace: "pre", lineHeight: CELL, gap: "1ch" }}>
      <span style={{ color }}>{bar}</span>
      <span style={{ color: "var(--fg-dim)" }}>{String(pct).padStart(3, " ")}%</span>
    </div>
  );
}

// A line of inverse-video key chips (the TUI "button"/active treatment).
function KeyChips({ chips }) {
  return (
    <div style={{ display: "flex", gap: "1ch", whiteSpace: "pre", lineHeight: CELL }}>
      {chips.map((c, i) => (
        <span key={i} className={c.accent ? "inverse-accent" : "inverse"} style={{ padding: "0 1ch" }}>
          {c.k}
        </span>
      ))}
    </div>
  );
}

// A tiny non-flexing pane used to demo a Pane tone (and the legacy square shape).
function BorderSpecimen({ label, tone = "resting", shape }) {
  return (
    <Pane title={label} tone={tone} variant={shape === "square" ? "square" : undefined} flex="0 0 auto">
      <div style={{ whiteSpace: "pre", color: "var(--fg-dim)", lineHeight: CELL }}>
        {tone === "error"
          ? <span><span style={{ color: "var(--state-err)" }}>{STATE.cross}</span> error · red</span>
          : tone === "focus"
          ? <span><span style={{ color: "var(--accent)" }}>{NAV.focus}</span> focus · lavender</span>
          : shape === "square"
          ? "square · legacy"
          : "resting · muted"}
      </div>
    </Pane>
  );
}

Object.assign(window, { KV, GlyphCell, GlyphBank, BlockBar, KeyChips, BorderSpecimen });

// Banner.jsx — a one-line, non-blocking, in-flow notice. It sits in the normal
// layout flow (between content and footer), never overlays, never animates.
// Semantic colour lives on the LEADING GLYPH; the message text stays calm
// (--fg-muted), per the blink contract.
//
// INTENT, NOT STYLE: the consumer picks a `tone`; the framework owns the glyph
// and the colour. There is no glyph/colour override.
//
// Props:
//   tone:  'info' | 'success' | 'warn'   (default 'info')
//   children / text: the message (one line; truncates, never wraps)

function Banner({ tone = "info", children, text }) {
  const tones = {
    info:    { g: NAV.depends,  c: "var(--state-info)" },  // ↳ sapphire
    success: { g: STATE.check,  c: "var(--state-ok)" },    // ✓ green
    warn:    { g: STATE.warn,   c: "var(--state-warn)" },  // ⚠ yellow
  };
  const t = tones[tone] || tones.info;
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: "1ch",
      padding: "0 1ch", whiteSpace: "pre", overflow: "hidden",
      flexShrink: 0, lineHeight: "var(--cell-h)",
    }}>
      <span style={{ color: t.c, width: "1ch", flexShrink: 0 }}>{t.g}</span>
      <span style={{ color: "var(--fg-muted)", overflow: "hidden", textOverflow: "clip" }}>
        {children != null ? children : text}
      </span>
    </div>
  );
}

window.Banner = Banner;

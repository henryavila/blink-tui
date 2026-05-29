// Header.jsx — the one-row status bar that tops every wizard/app screen:
// a lavender mark, a title (with optional · subtitle), and a right status slot.
// Recurs across every blink screen, so it is a primitive, not app code.
//
// Props:
//   mark:     leading accent glyph (default '▎', the blink cursor block)
//   title:    screen title (--fg)
//   subtitle: optional aside, rendered '· subtitle' in --fg-muted
//   right:    optional node flush-right (status / counts / delta summary)

function Header({ mark = "▎", title, subtitle, right }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      gap: "2ch", padding: "0 1ch", whiteSpace: "pre", overflow: "hidden",
      flexShrink: 0, lineHeight: "var(--cell-h)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "1ch", overflow: "hidden" }}>
        {mark ? <span style={{ color: "var(--accent)", flexShrink: 0 }}>{mark}</span> : null}
        <span style={{ color: "var(--fg)", flexShrink: 0 }}>{title}</span>
        {subtitle ? <span style={{ color: "var(--fg-muted)", overflow: "hidden", textOverflow: "clip" }}>{"· " + subtitle}</span> : null}
      </div>
      {right != null ? <div style={{ color: "var(--fg-muted)", flexShrink: 0 }}>{right}</div> : null}
    </div>
  );
}

window.Header = Header;

// Footer.jsx — the always-visible hotkey bar pinned to the bottom row.
// Keys render in inverse video; labels in muted text. One line, no wrap.
//
// keys:      [{ k: "tab", desc: "switch pane" }, ...]
// right:     optional status node shown flush-right (e.g. "services · 6 of 8")
// marginTop: cells of breathing room above the bar. House default is 1 so the
//            footer never butts up against the content above it; pass 0 to pin flush.

function Hotkey({ k, desc }) {
  return (
    <span style={{ whiteSpace: "pre", display: "inline-flex", alignItems: "baseline" }}>
      <span style={{
        color: "var(--fg-inverse)", background: "var(--bg-inverse)",
        padding: "0 1ch",
      }}>{k}</span>
      <span style={{ color: "var(--fg-muted)", paddingLeft: "1ch" }}>{desc}</span>
    </span>
  );
}

function Footer({ keys = [], right, marginTop = 1 }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      gap: "2ch", background: "var(--bg-sunken)", color: "var(--fg-muted)",
      padding: "0 1ch", lineHeight: "var(--cell-h)", whiteSpace: "pre",
      overflow: "hidden", flexShrink: 0,
      marginTop: `calc(var(--cell-h) * ${marginTop})`,
    }}>
      <div style={{ display: "flex", gap: "3ch", overflow: "hidden" }}>
        {keys.map((h, i) => <Hotkey key={i} k={h.k} desc={h.desc} />)}
      </div>
      {right != null ? (
        <div style={{ color: "var(--fg-faint)", flexShrink: 0 }}>{right}</div>
      ) : null}
    </div>
  );
}

Object.assign(window, { Footer, Hotkey });

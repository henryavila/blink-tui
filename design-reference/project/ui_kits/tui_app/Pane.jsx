// Pane.jsx — a box-drawn rectangle with an optional title in the top border.
// Borders are real box-drawing characters laid on a flex column, never CSS.
//
// Props:
//   title    string shown inside the top border:  ┌─ title ──────┐
//   focused  bool   → double border + accent colour
//   variant  "default" | "rounded" | "double" | "error"
//   flex     css flex value for the pane (default "1")
//   width    optional fixed cell width (e.g. 36) → renders exact glyph rows
//   children pane body

function Pane({ title, focused = false, variant, flex = "1", children, style = {} }) {
  const v = variant || (focused ? "double" : "default");
  const sets = {
    default: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
    rounded: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
    double:  { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" },
    error:   { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" },
  };
  const s = sets[v] || sets.default;

  const borderColor =
    v === "error" ? "var(--state-err)"
    : focused ? "var(--border-focus)"
    : "var(--border)";
  const titleColor =
    v === "error" ? "var(--state-err)"
    : focused ? "var(--accent)"
    : "var(--fg-muted)";

  // Top border: corner + "─ title " + fill + corner
  const head = (
    <div style={{ color: borderColor, whiteSpace: "pre", display: "flex" }}>
      <span>{s.tl}{s.h}</span>
      {title ? <span style={{ color: titleColor }}>{" " + title + " "}</span> : <span>{s.h}</span>}
      <span style={{ flex: 1, overflow: "hidden" }}>{s.h.repeat(200)}</span>
      <span>{s.tr}</span>
    </div>
  );
  const foot = (
    <div style={{ color: borderColor, whiteSpace: "pre", display: "flex" }}>
      <span>{s.bl}</span>
      <span style={{ flex: 1, overflow: "hidden" }}>{s.h.repeat(200)}</span>
      <span>{s.br}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex, minWidth: 0, minHeight: 0, ...style }}>
      {head}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <span style={{ color: borderColor }}>{s.v}</span>
        <div style={{ flex: 1, minWidth: 0, padding: "0 1ch", overflow: "hidden" }}>
          {children}
        </div>
        <span style={{ color: borderColor }}>{s.v}</span>
      </div>
      {foot}
    </div>
  );
}

window.Pane = Pane;

// Pane.jsx — a box-drawn rectangle with an optional title in the top border.
// Borders are real box-drawing characters laid on a flex column, never CSS.
//
// HOUSE STYLE: there is exactly ONE border shape — single-line, ROUNDED corners
// (╭ ╮ ╰ ╯). The consumer never picks a shape; blink owns it. Borders are
// exposed by PURPOSE, not by appearance.
//
// PUBLIC API — `tone` (semantic intent), never a shape name:
//   tone="resting"  default — muted border, a pane at rest
//   tone="focus"    the focused pane — border + title recoloured lavender
//   tone="error"    an error / destructive pane — border + title red
// Focus and elevation are colour, never line weight. The shape never changes
// between tones, so the layout never shifts.
//
// Props:
//   title    string shown inside the top border:  ╭─ title ──────╮
//   tone     "resting" | "focus" | "error"   (default "resting")
//   flex     css flex value for the pane (default "1")
//   children pane body
//
// Back-compat (do not use in new code): `focused` (bool ⇒ tone "focus"),
// `variant` ("error" ⇒ tone "error"; "square" ⇒ legacy square shape; other
// values ⇒ the rounded house style). These keep older call sites working while
// code migrates to `tone`.

function Pane({ title, tone, focused = false, variant, flex = "1", children, style = {} }) {
  // Resolve PURPOSE: prefer the semantic `tone`, then fall back to legacy props.
  const t = tone
    || (variant === "error" ? "error"
    : focused ? "focus"
    : "resting");

  // Resolve SHAPE: always rounded, except the legacy `variant="square"` escape.
  const shapes = {
    rounded: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
    square:  { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
  };
  const s = variant === "square" ? shapes.square : shapes.rounded;

  const borderColor =
    t === "error" ? "var(--state-err)"
    : t === "focus" ? "var(--border-focus)"
    : "var(--border)";
  const titleColor =
    t === "error" ? "var(--state-err)"
    : t === "focus" ? "var(--accent)"
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

// Input.jsx — single-line text field. Placeholder in --fg-disabled; a ▎ cursor
// blinks at 1 Hz with step-end timing (the only permitted text motion).
// Border is box-drawing, single-line rounded; focused → accent, error → red.

function Cursor() {
  return <span className="tui-cursor" style={{ color: "var(--fg)" }}>▎</span>;
}

function Input({ title, value = "", placeholder = "", focused = false, error }) {
  const tone = error ? "error" : focused ? "focus" : "resting";
  const showPlaceholder = value.length === 0;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Pane title={title} tone={tone} flex="0 0 auto">
        <div style={{ whiteSpace: "pre", lineHeight: "var(--cell-h)" }}>
          {showPlaceholder
            ? <span style={{ color: "var(--fg-disabled)" }}>{placeholder}</span>
            : <span style={{ color: "var(--fg)" }}>{value}</span>}
          {focused ? <Cursor /> : null}
        </div>
      </Pane>
      {error ? (
        <div style={{ whiteSpace: "pre", paddingLeft: "1ch" }}>
          <span style={{ color: "var(--state-err)" }}>{STATE.cross}</span>
          {" "}
          <span style={{ color: "var(--fg-muted)" }}>{error}</span>
        </div>
      ) : null}
    </div>
  );
}

Object.assign(window, { Input, Cursor });

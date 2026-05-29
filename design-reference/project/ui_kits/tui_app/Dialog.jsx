// Dialog.jsx — a centred modal with a double-line border. The default action
// renders in inverse-accent video; the alternative is plain. No backdrop blur,
// no fade, no transform — it simply replaces focus.
//
// title, variant ("default"|"error"), lines: string[] of body rows,
// actions: [{ key, label, primary }]

function Dialog({ title, variant = "default", lines = [], actions = [], width = 44 }) {
  const isError = variant === "error";
  return (
    <div style={{
      // overlay: a plain flex centerer over the app. No blur/opacity.
      position: "absolute", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: `${width}ch`, background: "var(--bg)" }}>
        <Pane title={title} variant={isError ? "error" : "double"}
              focused={!isError} flex="0 0 auto">
          <div style={{ display: "flex", flexDirection: "column", padding: "0 1ch" }}>
            <div style={{ height: "var(--cell-h)" }} />
            {lines.map((ln, i) => (
              <div key={i} style={{ whiteSpace: "pre", color: "var(--fg)", lineHeight: "var(--cell-h)" }}>
                {ln}
              </div>
            ))}
            <div style={{ height: "var(--cell-h)" }} />
            <div style={{ display: "flex", gap: "2ch", whiteSpace: "pre" }}>
              {actions.map((a, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: "1ch" }}>
                  <span style={a.primary ? {
                    background: "var(--accent)", color: "var(--ctp-base)", padding: "0 1ch",
                  } : { padding: "0 1ch", color: "var(--fg-muted)" }}>
                    {a.key}
                  </span>
                  <span style={{ color: "var(--fg-muted)" }}>{a.label}</span>
                </span>
              ))}
            </div>
            <div style={{ height: "var(--cell-h)" }} />
          </div>
        </Pane>
      </div>
    </div>
  );
}

window.Dialog = Dialog;

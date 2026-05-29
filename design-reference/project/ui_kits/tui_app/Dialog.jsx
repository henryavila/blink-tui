// Dialog.jsx — a centred modal: a focused (lavender) rounded pane that overlays
// the app. The default action renders in inverse-accent video; the alternative
// is plain. No backdrop blur, no fade, no transform, no double border — it
// simply replaces focus.
//
// INTENT, NOT STYLE:
//   tone     'default' | 'error'  — 'default' is a focused (lavender) modal;
//            'error' recolours it red. The consumer never picks the shape.
//   title    modal title (inside the top border)
//   body     either lines: string[] (plain) OR children (rich body — e.g. a
//            DescriptionList or wrapped message). children wins when both set.
//   actions  [{ key, label, primary }] — the primary renders inverse-accent.

function Dialog({ title, tone = "default", lines = [], children, actions = [], width = 44 }) {
  const isError = tone === "error";
  return (
    <div style={{
      // overlay: a plain flex centerer over the app. No blur/opacity.
      position: "absolute", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: `${width}ch`, background: "var(--bg)" }}>
        <Pane title={title} tone={isError ? "error" : "focus"}
              flex="0 0 auto">
          <div style={{ display: "flex", flexDirection: "column", padding: "0 1ch" }}>
            <div style={{ height: "var(--cell-h)" }} />
            {children != null ? children : lines.map((ln, i) => (
              <div key={i} style={{ whiteSpace: "pre", color: "var(--fg)", lineHeight: "var(--cell-h)" }}>
                {ln}
              </div>
            ))}
            <div style={{ height: "var(--cell-h)" }} />
            <div style={{ display: "flex", gap: "2ch", whiteSpace: "pre" }}>
              {actions.map((a, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: "1ch" }}>
                  <span style={a.primary ? {
                    background: "var(--accent)", color: "var(--fg-inverse)", padding: "0 1ch",
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

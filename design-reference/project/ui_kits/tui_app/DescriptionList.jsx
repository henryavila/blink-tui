// DescriptionList.jsx — a key/value block aligned to a character gutter.
// The generic shape behind any detail pane or summary screen.
//
// INTENT, NOT STYLE: a row may carry a semantic `state` (→ framework glyph +
// colour) and a `muted` flag (→ de-emphasised value). The consumer never passes
// a raw glyph or colour. Term-less rows render as a full-width value line.
//
// Props:
//   items:  [{ term?, value, state?, muted? }]
//             state → leading glyph + colour via stateGlyph()
//             muted → value rendered in --fg-muted (e.g. a description line)
//   gutter: term column width in ch (default 10)

function DescriptionList({ items = [], gutter = 10 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((it, i) => {
        const st = it.state ? stateGlyph(it.state) : null;
        return (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "1ch", whiteSpace: "pre", lineHeight: "var(--cell-h)" }}>
            {it.term != null ? (
              <span style={{ color: "var(--fg-dim)", width: `${gutter}ch`, flexShrink: 0 }}>{it.term}</span>
            ) : null}
            {st ? (
              <span style={{ color: st.color, width: "1ch", flexShrink: 0 }}>{st.glyph}</span>
            ) : null}
            <span style={{ color: it.muted ? "var(--fg-muted)" : "var(--fg)", overflow: "hidden", textOverflow: "clip" }}>{it.value}</span>
          </div>
        );
      })}
    </div>
  );
}

window.DescriptionList = DescriptionList;

// List.jsx — vertical list of rows. ▶ marks focus; surface1 fills the focused
// row; surface0 fills a selected (but unfocused) row. No hover, ever.
//
// rows: [{ id, glyph, glyphColor, label, meta, domain }]
// focusedId: id of the row with the ▶ caret
// selectedIds: Set of ids drawn with the selection fill

function ListRow({ row, focused, selected }) {
  const bg = focused ? "var(--bg-focused)"
           : selected ? "var(--bg-selected)"
           : "transparent";
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: "1ch",
      padding: "0 1ch", background: bg, whiteSpace: "pre",
    }}>
      <span style={{ color: "var(--accent)", width: "1ch", flexShrink: 0 }}>
        {focused ? NAV.focus : " "}
      </span>
      {row.domain ? (
        <span style={{ color: row.domainColor || "var(--fg-muted)", width: "2ch", flexShrink: 0 }}>
          {row.domain}
        </span>
      ) : null}
      <span style={{ color: row.glyphColor || "var(--fg)", width: "1ch", flexShrink: 0 }}>
        {row.glyph || " "}
      </span>
      <span style={{ color: "var(--fg)" }}>{row.label}</span>
      {row.meta ? (
        <span style={{ color: "var(--fg-dim)", marginLeft: "auto", paddingLeft: "2ch" }}>
          {row.meta}
        </span>
      ) : null}
    </div>
  );
}

function List({ rows, focusedId, selectedIds }) {
  const sel = selectedIds || new Set();
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {rows.map((r) => (
        <ListRow key={r.id} row={r}
          focused={r.id === focusedId}
          selected={sel.has(r.id)} />
      ))}
    </div>
  );
}

Object.assign(window, { List, ListRow });

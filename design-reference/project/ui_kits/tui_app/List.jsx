// List.jsx — vertical list of rows on the character grid.
//
// INTENT, NOT STYLE: a row declares what it MEANS; the framework renders the
// glyph + colour. The consumer never passes a raw glyph or a raw colour.
//
// ListRowData: { id, label, state?, selected?, locked?, domain?, meta?, muted? }
//   state     semantic status name → glyph + colour via stateGlyph():
//             installed | ok | missing | error | drift | partial | idempotent |
//             pending | warn | info
//   selected  selection intent (bool) → ☑ / ☐
//   locked    required, non-toggle (bool) → ▣  (implies selected)
//   domain    registered domain glyph NAME → glyph + colour from the registry
//   meta      right-aligned consequence/aside text (content)
//   muted     de-emphasise the whole row (e.g. a disabled / required label)
//
// Column order (each cell a fixed character width, so rows align):
//   ▶  focus · ☑/☐/▣ selection · state glyph · domain glyph · label · meta
//
// Windowing: pass `height` (visible content rows). The window follows
// `focusedId`; `▴ N more` / `▾ N more` mark hidden rows. overflowMarkers
// defaults true. This is keyboard paging — no wheel, no scrollbar.
//
// Props: { rows, focusedId, selectedIds?, height?, overflowMarkers? }

function selectionIntent(row) {
  if (row.locked) return SELECTION.locked;
  if (row.selected) return SELECTION.selected;
  return SELECTION.unselected;
}

function CheckCell({ row, show }) {
  if (!show) return null;
  const hasSelection = row.locked || "selected" in row;
  if (!hasSelection) return <span style={{ width: "1ch", flexShrink: 0 }}> </span>;
  const sel = selectionIntent(row);
  return <span style={{ width: "1ch", flexShrink: 0, color: sel.color }}>{sel.glyph}</span>;
}

function ListRow({ row, focused, selected, showCheckbox, showState, showDomain }) {
  const bg = focused ? "var(--bg-focused)"
           : selected ? "var(--bg-selected)"
           : "transparent";
  const labelColor = row.muted ? "var(--fg-dim)" : "var(--fg)";
  const st = row.state ? stateGlyph(row.state) : null;
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: "1ch",
      padding: "0 1ch", background: bg, whiteSpace: "pre",
    }}>
      <span style={{ color: "var(--accent)", width: "1ch", flexShrink: 0 }}>
        {focused ? NAV.focus : " "}
      </span>
      <CheckCell row={row} show={showCheckbox} />
      {showState ? (
        <span style={{ color: row.muted ? "var(--fg-dim)" : (st ? st.color : "var(--fg)"), width: "1ch", flexShrink: 0 }}>
          {st ? st.glyph : " "}
        </span>
      ) : null}
      {showDomain ? (
        <span style={{ color: row.muted ? "var(--fg-dim)" : glyphColor(row.domain), width: "2ch", flexShrink: 0 }}>
          {row.domain ? glyph(row.domain) : " "}
        </span>
      ) : null}
      <span style={{ color: labelColor, overflow: "hidden", textOverflow: "clip" }}>{row.label}</span>
      {row.meta ? (
        <span style={{ color: "var(--fg-dim)", marginLeft: "auto", paddingLeft: "2ch", flexShrink: 0 }}>
          {row.meta}
        </span>
      ) : null}
    </div>
  );
}

function OverflowMarker({ dir, count }) {
  return (
    <div style={{ display: "flex", gap: "1ch", padding: "0 1ch", color: "var(--fg-faint)", whiteSpace: "pre" }}>
      <span style={{ width: "1ch", flexShrink: 0 }}> </span>
      <span>{dir === "up" ? NAV.moreAbove : NAV.moreBelow}{" "}{count} more</span>
    </div>
  );
}

// Compute the visible window so the focused row stays in view, centred-ish.
function computeWindow(count, focusedIndex, height) {
  if (!height || count <= height) return { start: 0, end: count };
  let start = focusedIndex - Math.floor(height / 2);
  start = Math.max(0, Math.min(start, count - height));
  return { start, end: start + height };
}

function List({ rows, focusedId, selectedIds, height, overflowMarkers = true }) {
  const sel = selectedIds || new Set();
  const showCheckbox = rows.some((r) => r.locked || "selected" in r);
  const showState = rows.some((r) => r.state != null);
  const showDomain = rows.some((r) => r.domain != null);

  const focusedIndex = Math.max(0, rows.findIndex((r) => r.id === focusedId));
  const { start, end } = computeWindow(rows.length, focusedIndex, height);
  const slice = rows.slice(start, end);
  const above = start;
  const below = rows.length - end;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {overflowMarkers && above > 0 ? <OverflowMarker dir="up" count={above} /> : null}
      {slice.map((r) => (
        <ListRow key={r.id} row={r}
          focused={r.id === focusedId}
          selected={sel.has(r.id)}
          showCheckbox={showCheckbox}
          showState={showState}
          showDomain={showDomain} />
      ))}
      {overflowMarkers && below > 0 ? <OverflowMarker dir="down" count={below} /> : null}
    </div>
  );
}

Object.assign(window, { List, ListRow, CheckCell, OverflowMarker });

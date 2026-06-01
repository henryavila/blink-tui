// ProgressList.jsx — execution of a list of steps / tasks that transition
// through states (pending → running → ok/failed), with a LIVE spinner on the
// running line and an aggregate ProgressBar. Universal to any apply / migrate /
// sync / build. blink already owns the Spinner and the eighth-block ramp; this
// is the LIST that binds per-line `state` to (glyph or spinner) + colour, plus
// the bar, following the active line.
//
// INTENT, NOT STYLE:
//   ProgressBar  value (0..1) + width → blink draws █░ in --accent, with
//                eighth-block precision on the boundary cell.
//   ProgressList items[].state (intent) → blink owns the glyph + colour:
//        ◯ pending · Spinner running (the ONLY sanctioned animation) · ✓ ok ·
//        ✗ failed · ◐ waiting · ◌ skipped. The active line carries the
//        --bg-focused fill; the list windows (▴/▾ N) like List, following the
//        active line. A line may stay running / waiting INDEFINITELY — `waiting`
//        (◐, --state-warn) reads apart from `running` so a step blocked on a
//        manual action (e.g. Syncthing pairing, which waits on ↵) is legible.
//        (The pause PROMPT itself is an app Dialog — not a primitive.)

// ── ProgressBar ─────────────────────────────────────────────────────────────
// Eighth-block ramp: the fractional boundary cell renders the right partial
// block so the bar is precise to 1/8 of a cell, not just whole cells.
const PROGRESS_EIGHTHS = [" ", "▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"];

function ProgressBar({ value, width = 40, showPercent = true }) {
  const v = Math.max(0, Math.min(1, value || 0));
  const filled = v * width;
  const full = Math.floor(filled);
  const partIdx = Math.round((filled - full) * 8);
  let rest = width - full;
  let partial = "";
  if (partIdx > 0 && rest > 0) { partial = PROGRESS_EIGHTHS[partIdx]; rest -= 1; }
  const pct = Math.round(v * 100);
  return (
    <span style={{ whiteSpace: "pre" }}>
      <span style={{ color: "var(--accent)" }}>{"█".repeat(full)}{partial}</span>
      <span style={{ color: "var(--border)" }}>{"░".repeat(Math.max(0, rest))}</span>
      {showPercent ? <span style={{ color: "var(--fg-dim)" }}>{"  " + pct + "%"}</span> : null}
    </span>
  );
}

// ── state → glyph + colour (intent map; `running` resolves to the spinner) ────
const PROGRESS_STATES = {
  pending: { glyph: STATE.circle, color: "var(--state-pending)" },  // ◯
  ok:      { glyph: STATE.check,  color: "var(--state-ok)" },       // ✓
  done:    { glyph: STATE.check,  color: "var(--state-ok)" },       // ✓
  failed:  { glyph: STATE.cross,  color: "var(--state-err)" },      // ✗
  error:   { glyph: STATE.cross,  color: "var(--state-err)" },      // ✗
  waiting: { glyph: STATE.half,   color: "var(--state-warn)" },     // ◐ blocked on manual action
  skipped: { glyph: "◌",          color: "var(--fg-disabled)" },    // ◌ not run
};
function progressState(name) { return PROGRESS_STATES[name] || null; }

// The single sanctioned animation: the running line's braille spinner.
function RunningSpinner() {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SPINNER.length), 80);
    return () => clearInterval(t);
  }, []);
  return <span style={{ color: "var(--state-info)" }}>{SPINNER[i]}</span>;
}

function labelColor(state) {
  if (state === "skipped") return "var(--fg-disabled)";
  if (state === "pending") return "var(--fg-muted)";
  return "var(--fg)";
}

// ProgressItem: { id, label, domain?, state, meta? }
function ProgressRow({ item, active, showDomain }) {
  const running = item.state === "running";
  const st = running ? null : progressState(item.state);
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: "1ch", padding: "0 1ch",
      background: active ? "var(--bg-focused)" : "transparent", whiteSpace: "pre",
    }}>
      <span style={{ width: "1ch", flexShrink: 0 }}>
        {running ? <RunningSpinner /> : <span style={{ color: st ? st.color : "var(--fg)" }}>{st ? st.glyph : " "}</span>}
      </span>
      {showDomain ? (
        <span style={{ width: "2ch", flexShrink: 0, color: item.domain ? glyphColor(item.domain) : "var(--fg)" }}>
          {item.domain ? glyph(item.domain) : " "}
        </span>
      ) : null}
      <span style={{ color: labelColor(item.state), overflow: "hidden", textOverflow: "clip" }}>{item.label}</span>
      {item.meta ? (
        <span style={{ color: "var(--fg-dim)", marginLeft: "auto", paddingLeft: "2ch", flexShrink: 0 }}>{item.meta}</span>
      ) : null}
    </div>
  );
}

function ProgressOverflow({ dir, count }) {
  return (
    <div style={{ display: "flex", gap: "1ch", padding: "0 1ch", color: "var(--fg-faint)", whiteSpace: "pre" }}>
      <span style={{ width: "1ch", flexShrink: 0 }}> </span>
      <span>{(dir === "up" ? NAV.moreAbove : NAV.moreBelow) + " " + count + " more"}</span>
    </div>
  );
}

// Window the list so the active (executing) line stays in view, like List.
function progressWindow(count, activeIndex, height) {
  if (!height || count <= height) return { start: 0, end: count };
  let start = activeIndex - Math.floor(height / 2);
  start = Math.max(0, Math.min(start, count - height));
  return { start, end: start + height };
}

function ProgressList({ items, activeId, height, overflowMarkers = true }) {
  const showDomain = items.some((it) => it.domain != null);
  const activeIndex = Math.max(0, items.findIndex((it) => it.id === activeId));
  const { start, end } = progressWindow(items.length, activeIndex, height);
  const slice = items.slice(start, end);
  const above = start;
  const below = items.length - end;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {overflowMarkers && above > 0 ? <ProgressOverflow dir="up" count={above} /> : null}
      {slice.map((it) => (
        <ProgressRow key={it.id} item={it} active={it.id === activeId} showDomain={showDomain} />
      ))}
      {overflowMarkers && below > 0 ? <ProgressOverflow dir="down" count={below} /> : null}
    </div>
  );
}

Object.assign(window, {
  ProgressBar, ProgressList, ProgressRow,
  PROGRESS_STATES, progressState, RunningSpinner, PROGRESS_EIGHTHS,
});

// glyphs.js — blink CORE glyphs + the extensible glyph registry.
//
// CONTRACT vs CONTENT
//   STATE / NAV / BOX / SPINNER below are the framework CONTRACT: they appear
//   in every blink app and never change. They are exposed as plain constants.
//
//   Domain glyphs (mysql, docker, laravel, tailscale, …) are CONTENT, not
//   contract — they only make sense for the app that uses them. blink ships
//   NONE of them in core. An app registers its own at boot via registerGlyphs()
//   and reads them back through glyph(name), which resolves with the SAME
//   icon-set detection + {nerd → unicode → ascii} fallback as core glyphs.
//
//   COMMON_DOMAINS is an OPTIONAL convenience pack (the dev-tool domains most
//   TUIs want). It is NOT auto-registered. An app opts in explicitly:
//       registerGlyphs(COMMON_DOMAINS)            // take the pack
//       registerGlyphs({ laravel: {...} })        // add its own
//       registerGlyphs({ database: {...} })       // override a pack entry

// ── core: the contract ──────────────────────────────────────────────────────
const STATE = {
  check:        "✓",
  cross:        "✗",
  circle:       "◯",
  half:         "◐",
  checkboxOn:   "☑",
  checkboxOff:  "☐",
  checkboxLock: "▣",   // selected + locked (required bundle — no toggle)
  warn:         "⚠",
  rerun:        "↻",
};

const NAV = {
  focus:     "▶",
  collapsed: "▸",
  expanded:  "▾",
  depends:   "↳",
  flow:      "→",
  back:      "◀",
  moreAbove: "▴",   // windowed list: rows hidden above
  moreBelow: "▾",   // windowed list: rows hidden below
};

const BOX = {
  tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│",
  teeL: "├", teeR: "┤", teeT: "┬", teeB: "┴", cross: "┼",
  rtl: "╭", rtr: "╮", rbl: "╰", rbr: "╯",
};

const SPINNER = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

// ── the registry: app-extensible content ────────────────────────────────────
// icon set: 'nerd' (default, CaskaydiaMono present) | 'unicode' | 'ascii'.
// In production blink detects this from the terminal; mocks set it directly.
let ICON_SET = "nerd";
function setIconSet(set) { ICON_SET = set; }
function getIconSet() { return ICON_SET; }

const _registry = {};

// registerGlyphs({ name: { nerd, unicode, ascii } }) — merge into the registry.
function registerGlyphs(map) { Object.assign(_registry, map || {}); return _registry; }

// glyph(name) — resolve one registered glyph for the active icon set, with
// graceful fallback. Returns "" for an unregistered name (never throws).
function glyph(name) {
  const e = _registry[name];
  if (!e) return "";
  if (ICON_SET === "ascii")   return e.ascii   != null ? e.ascii   : (e.unicode != null ? e.unicode : "");
  if (ICON_SET === "unicode") return e.unicode != null ? e.unicode : (e.ascii   != null ? e.ascii   : "");
  return e.nerd != null ? e.nerd : (e.unicode != null ? e.unicode : (e.ascii != null ? e.ascii : ""));
}

// glyphColor(name) — the colour a registered domain glyph renders in. Owned at
// REGISTRATION (registerGlyphs({ x: { …, color } })), never per render site, so
// the consumer expresses "this is a postgres row", not "paint this blue".
function glyphColor(name) {
  const e = _registry[name];
  return (e && e.color) || "var(--fg-muted)";
}

// ── intent → (glyph, colour) ──────────────────────────────────────────────
// The framework owns the mapping from a semantic STATE name to its glyph and
// colour. Components take an intent name (state="installed"); they never accept
// a raw glyph or a raw colour from the consumer.
const STATES = {
  installed:  { glyph: STATE.check,  color: "var(--state-ok)" },
  ok:         { glyph: STATE.check,  color: "var(--state-ok)" },
  done:       { glyph: STATE.check,  color: "var(--state-ok)" },
  missing:    { glyph: STATE.cross,  color: "var(--state-err)" },
  err:        { glyph: STATE.cross,  color: "var(--state-err)" },
  error:      { glyph: STATE.cross,  color: "var(--state-err)" },
  failed:     { glyph: STATE.cross,  color: "var(--state-err)" },
  drift:      { glyph: STATE.half,   color: "var(--state-warn)" },
  partial:    { glyph: STATE.half,   color: "var(--state-warn)" },
  warn:       { glyph: STATE.warn,   color: "var(--state-warn)" },
  idempotent: { glyph: STATE.rerun,  color: "var(--fg-muted)" },
  pending:    { glyph: STATE.circle, color: "var(--state-pending)" },
  info:       { glyph: NAV.depends,  color: "var(--state-info)" },
};
// stateGlyph(name) → { glyph, color } | null
function stateGlyph(name) { return STATES[name] || null; }

// Selection intent → checkbox glyph + colour.
const SELECTION = {
  selected:   { glyph: STATE.checkboxOn,   color: "var(--accent)" },
  unselected: { glyph: STATE.checkboxOff,  color: "var(--fg-dim)" },
  locked:     { glyph: STATE.checkboxLock, color: "var(--fg-muted)" }, // selected + non-toggle
};

// ── OPTIONAL convenience pack — NOT registered automatically ─────────────────
// The dev-tool domains most TUIs reuse. An app opts in with
// registerGlyphs(COMMON_DOMAINS) and is free to extend or override any entry.
// Each entry may carry a `color` (owned here, at registration — not per row).
const COMMON_DOMAINS = {
  database:   { nerd: "\uf1c0", unicode: "▤", ascii: "db",  color: "var(--fg-muted)" },
  mysql:      { nerd: "\ue704", unicode: "▤", ascii: "my",  color: "var(--ctp-sapphire)" },
  postgresql: { nerd: "\ue76e", unicode: "▤", ascii: "pg",  color: "var(--ctp-blue)" },
  redis:      { nerd: "\ue76d", unicode: "◆", ascii: "rd",  color: "var(--ctp-red)" },
  docker:     { nerd: "\uf308", unicode: "▦", ascii: "dk",  color: "var(--ctp-sky)" },
  github:     { nerd: "\uf09b", unicode: "◉", ascii: "gh",  color: "var(--fg-muted)" },
  git:        { nerd: "\ue702", unicode: "◈", ascii: "gt",  color: "var(--ctp-peach)" },
  ssh:        { nerd: "\uf015", unicode: "⌂", ascii: "sh",  color: "var(--ctp-yellow)" },
  nodejs:     { nerd: "\ue718", unicode: "❖", ascii: "nd",  color: "var(--ctp-green)" },
  php:        { nerd: "\ue73d", unicode: "❮", ascii: "ph",  color: "var(--ctp-mauve)" },
  python:     { nerd: "\ue73c", unicode: "❯", ascii: "py",  color: "var(--ctp-yellow)" },
  vim:        { nerd: "\ue7c5", unicode: "✱", ascii: "vi",  color: "var(--ctp-green)" },
  apple:      { nerd: "\uf179", unicode: "", ascii: "mac", color: "var(--fg-muted)" },
  linux:      { nerd: "\uf17c", unicode: "△", ascii: "lx",  color: "var(--ctp-yellow)" },
  ubuntu:     { nerd: "\uf31b", unicode: "○", ascii: "ub",  color: "var(--ctp-peach)" },
  font:       { nerd: "\uf031", unicode: "ƒ", ascii: "ft",  color: "var(--fg-muted)" },
  ai:         { nerd: "\uf2db", unicode: "▚", ascii: "ai",  color: "var(--accent)" },
  bolt:       { nerd: "\uf0e7", unicode: "⚡", ascii: "!",   color: "var(--ctp-peach)" },
};

Object.assign(window, {
  STATE, NAV, BOX, SPINNER, STATES, SELECTION,
  registerGlyphs, glyph, glyphColor, stateGlyph, setIconSet, getIconSet, COMMON_DOMAINS,
});

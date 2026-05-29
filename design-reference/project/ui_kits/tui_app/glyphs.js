// glyphs.js — blink CORE glyphs + the extensible glyph registry (the ENGINE).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE GLYPH MODEL — fonts vs. registry
//
//   The DRAWING of every Nerd Font glyph already lives in the user's terminal
//   FONT (CaskaydiaMono Nerd Font ships ~10k icons in the Private Use Area).
//   blink never bundles a single icon image — printing a codepoint is enough,
//   the font draws it. So "rendering capability" is free and already complete.
//
//   What blink owns is the *registry*: the map from a semantic NAME to a glyph
//   plus its curated fallbacks ({ unicode, ascii }) and its semantic `color`.
//   Those three (unicode fallback, ascii fallback, colour) are CURATION — they
//   can't be auto-derived for 10k icons — which is why blink degrades a glyph
//   instead of choosing one for you.
//
// ─────────────────────────────────────────────────────────────────────────────
// FOUR TIERS (each tier is opt-in except the contract)
//
//   Tier 0 · CONTRACT      STATE / NAV / BOX / SPINNER below. Always present,
//                          never change, fully curated. (this file)
//   Tier 1 · COMMON pack   ~18 dev-tool domains, fully curated.   (glyph-packs.js)
//   Tier 2 · CATEGORY packs databases / languages / cloud / editors / os /
//                          companies — fully curated, import only what you use.
//                                                                  (glyph-packs.js)
//   Tier 3 · RAW INDEX     name→codepoint for the WHOLE Nerd Font. No curated
//                          fallback, default colour, nerd-only. An escape hatch,
//                          resolved with nf().                     (glyph-index.js)
//
//   CONTRACT vs CONTENT: Tier 0 is contract (appears in every blink app). Tiers
//   1–3 are CONTENT — the app opts in and registers what it needs. blink core
//   ships zero domain glyphs registered by default.

// ── Tier 0: the contract ─────────────────────────────────────────────────────
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

// ── defaults for uncurated / easy-form glyphs ────────────────────────────────
// A raw glyph (no curated colour) renders muted — neutral, never semantic.
const DEFAULT_GLYPH_COLOR = "var(--fg-muted)";
// A registered glyph with no curated unicode fallback degrades to this neutral
// mark on a non–Nerd-Font terminal (one cell, geometric, palette-safe).
const DEFAULT_UNICODE = "◆";

// ── icon set ─────────────────────────────────────────────────────────────────
// 'nerd' (default, CaskaydiaMono present) | 'unicode' | 'ascii'.
// In production blink detects this from the terminal; mocks set it directly.
let ICON_SET = "nerd";
function setIconSet(set) { ICON_SET = set; }
function getIconSet() { return ICON_SET; }

// ── Tier 3 plumbing: nf() — resolve a codepoint from the raw index ───────────
// nf('dev-laravel') → the Nerd Font char (nerd-only, no fallback, default colour).
// Returns "" for an unknown name (never throws, never tofu-by-surprise on lookup).
// NERD_INDEX is provided by glyph-index.js; nf works without it loaded (→ "").
function nfChar(nameOrHex) {
  if (nameOrHex == null) return "";
  const idx = (typeof window !== "undefined" && window.NERD_INDEX) || {};
  let hex = idx[nameOrHex];
  // also accept a bare hex codepoint, e.g. nf('e73f')
  if (hex == null && /^[0-9a-fA-F]{2,6}$/.test(nameOrHex)) hex = nameOrHex;
  if (hex == null) return "";
  try { return String.fromCodePoint(parseInt(hex, 16)); } catch (_) { return ""; }
}
function nf(name)    { return nfChar(name); }                  // → char | ""
function nfHas(name) { const i = (typeof window !== "undefined" && window.NERD_INDEX) || {}; return name in i; }

// ── Tier 3 lazy-load: the FULL index, fetched on demand ──────────────────────
// glyph-index.js ships a small verified SEED. The generated full index (~10k,
// from scripts/build-glyph-index.mjs) is fetched + merged on demand so the
// bundle stays lean. Set the URL to "" to disable network entirely.
let _indexUrl = "glyph-index.full.json"; // relative to the page; override per app
let _indexLoad = null;                   // cached Promise — load happens once
let _indexLoaded = false;
let _autoTried = false;                  // a sync nf() miss auto-loads ONCE
const _indexListeners = [];

function setGlyphIndexUrl(url) { _indexUrl = url == null ? "" : url; }
function isGlyphIndexLoaded() { return _indexLoaded; }
// onGlyphIndex(fn) — fired after the full index merges (re-render hook for UIs).
function onGlyphIndex(fn) { if (typeof fn === "function") _indexListeners.push(fn); }

// loadGlyphIndex(url?) → Promise<NERD_INDEX>. Fetch the generated full index and
// merge it into window.NERD_INDEX (seed entries win — never clobbered).
// Idempotent: concurrent/repeat calls share one fetch. After it resolves, nf()
// and easy-form registration that previously missed will hit. Keys starting
// with "_" (e.g. "_meta") are ignored.
function loadGlyphIndex(url) {
  if (url) _indexUrl = url;
  if (_indexLoad) return _indexLoad;
  if (!_indexUrl) return Promise.resolve((typeof window !== "undefined" && window.NERD_INDEX) || {});
  _indexLoad = fetch(_indexUrl)
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (full) {
      const idx = (window.NERD_INDEX = window.NERD_INDEX || {});
      for (const k in full) { if (k[0] === "_") continue; if (!(k in idx)) idx[k] = full[k]; }
      _indexLoaded = true;
      _indexListeners.forEach(function (fn) { try { fn(idx); } catch (_) {} });
      return idx;
    })
    .catch(function (e) { _indexLoad = null; throw e; }); // null → explicit retry allowed
  return _indexLoad;
}

// nfAsync(name) → Promise<string>. Ensure the full index is loaded, then resolve.
// Use when you can await (e.g. an app boot that needs a not-in-seed glyph).
function nfAsync(name) {
  const hit = nfChar(name);
  if (hit) return Promise.resolve(hit);
  return loadGlyphIndex().then(function () { return nfChar(name); }, function () { return ""; });
}

// nf(name) — synchronous resolve. On a seed miss it kicks ONE background load of
// the full index (fire-and-forget) so a subsequent render hits; pair with
// onGlyphIndex() to re-render, or use nfAsync()/loadGlyphIndex() to await.
function nf(name) {
  const hit = nfChar(name);
  if (hit) return hit;
  if (name && !_indexLoaded && !_autoTried && _indexUrl) { _autoTried = true; loadGlyphIndex().catch(function () {}); }
  return "";
}

// ── the registry: app-extensible content ─────────────────────────────────────
const _registry = {};

// deriveAscii('postgresql') → '[po]'  ·  used when an entry omits an ascii fallback
function deriveAscii(name) {
  const s = String(name || "").replace(/[^a-z0-9]/gi, "").slice(0, 2).toLowerCase();
  return "[" + (s || "?") + "]";
}

// normalizeEntry(name, e) → { nerd, unicode, ascii, color }
// Accepts THREE shapes — pick whichever fits, all coexist:
//   verbose : { nerd:'\ue73f', unicode:'◆', ascii:'[la]', color:'var(--ctp-red)' }
//   easy    : { nf:'dev-laravel', color:'var(--ctp-red)' }   ← codepoint from index
//   raw cp  : { cp:'e73f', color:'…' }                       ← codepoint from hex
//   string  : '\ue73f'                                        ← nerd only, all defaults
// Everything not supplied is filled in: unicode→◆, ascii→derived, color→muted.
function normalizeEntry(name, e) {
  if (e == null) return null;
  if (typeof e === "string") e = { nerd: e };
  let nerd = e.nerd;
  if (nerd == null && e.cp != null) { try { nerd = String.fromCodePoint(parseInt(e.cp, 16)); } catch (_) {} }
  if (nerd == null && e.nf != null) nerd = nfChar(e.nf);
  return {
    nerd:    nerd != null ? nerd : "",
    unicode: e.unicode != null ? e.unicode : DEFAULT_UNICODE,
    ascii:   e.ascii   != null ? e.ascii   : deriveAscii(name),
    color:   e.color   != null ? e.color   : DEFAULT_GLYPH_COLOR,
  };
}

// registerGlyphs(...maps) — normalize + merge one or more maps into the
// registry. Later wins, so take packs then override individual entries:
//   registerGlyphs(COMMON_DOMAINS);
//   registerGlyphs(LANGUAGES, DATABASES);                          // many packs
//   registerGlyphs({ database: { nf:'fa-server', color:'var(--ctp-sky)' } });
function registerGlyphs() {
  for (let i = 0; i < arguments.length; i++) {
    const map = arguments[i];
    if (!map) continue;
    for (const name in map) {
      const n = normalizeEntry(name, map[name]);
      if (n) _registry[name] = n;
    }
  }
  return _registry;
}

// registerGlyph(name, entry) — single-entry convenience.
function registerGlyph(name, entry) { return registerGlyphs({ [name]: entry }); }

// glyph(name) — resolve one REGISTERED glyph for the active icon set, with the
// {nerd → unicode → ascii} fallback. Returns "" for an unregistered name. Only
// reads the registry — raw index names are NOT auto-resolved here (use nf()),
// which keeps "what my app uses" an explicit, registered set.
function glyph(name) {
  const e = _registry[name];
  if (!e) return "";
  if (ICON_SET === "ascii")   return e.ascii   || e.unicode || e.nerd || "";
  if (ICON_SET === "unicode") return e.unicode || e.ascii   || e.nerd || "";
  return e.nerd || e.unicode || e.ascii || "";
}

// glyphColor(name) — the colour a registered glyph renders in. Owned at
// REGISTRATION, never per render site, so the consumer expresses "this is a
// postgres row", not "paint this blue".
function glyphColor(name) {
  const e = _registry[name];
  return (e && e.color) || DEFAULT_GLYPH_COLOR;
}

// hasGlyph(name) / registeredNames() — introspection for pickers & tests.
function hasGlyph(name) { return name in _registry; }
function registeredNames() { return Object.keys(_registry).sort(); }

// ── intent → (glyph, colour) ─────────────────────────────────────────────────
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

Object.assign(window, {
  // contract
  STATE, NAV, BOX, SPINNER, STATES, SELECTION, stateGlyph,
  // registry engine
  registerGlyphs, registerGlyph, glyph, glyphColor, hasGlyph, registeredNames,
  setIconSet, getIconSet,
  // tier 3 escape hatch + lazy-load
  nf, nfHas, nfAsync, loadGlyphIndex, setGlyphIndexUrl, isGlyphIndexLoaded, onGlyphIndex,
  // exposed for pickers / docs
  DEFAULT_GLYPH_COLOR, DEFAULT_UNICODE, deriveAscii,
});

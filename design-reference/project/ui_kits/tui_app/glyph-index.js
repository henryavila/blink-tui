// glyph-index.js — blink TIER 3 · the raw Nerd Font index (escape hatch).
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THIS IS
//   A flat map of canonical Nerd Font names → codepoint (hex string), following
//   the upstream `glyphnames.json` naming convention (source-prefixed:
//   `fa-`, `dev-`, `seti-`, `pl-`, `cod-`, `oct-`, `md-`, `weather-`, …).
//
//   It carries NO curation: no unicode fallback, no ascii fallback, no semantic
//   colour. nf(name) returns the Nerd Font char only; on a non–Nerd-Font
//   terminal it has nothing to degrade to. Use it as a deliberate escape hatch:
//
//       nf('fa-rocket')                                  // → '' or the glyph
//       registerGlyphs({ deploy: { nf:'fa-rocket' } })   // muted, nerd-only
//
//   For anything an app shows often, promote it into a curated Tier 1/2 entry
//   (give it a colour + fallbacks) instead of leaning on the raw index.
//
// ─────────────────────────────────────────────────────────────────────────────
// SEED vs FULL
//   Shipped here is a VERIFIED SEED (~130 of the most-used glyphs across Font
//   Awesome, Devicons, Seti-UI and Powerline). The production index is GENERATED
//   — it is not hand-written — from the upstream Nerd Fonts `glyphnames.json`
//   (~10k entries), e.g.:
//
//       node scripts/build-glyph-index.mjs \
//         node_modules/nerdfonts/glyphnames.json > glyph-index.json
//
//   Generating keeps the full set always correct and lets the bundle stay lean:
//   ship the seed inline, lazy-load the full JSON only when nf() misses.
//
// ─────────────────────────────────────────────────────────────────────────────
// LAZY LOAD (engine: glyphs.js)
//   The generated full file (here: glyph-index.full.json) is fetched + merged on
//   demand — the seed always wins, nothing is clobbered:
//
//       setGlyphIndexUrl('glyph-index.full.json'); // default; '' disables fetch
//       await loadGlyphIndex();                     // explicit, idempotent
//       const c = await nfAsync('fa-rocket');       // ensure-loaded then resolve
//
//   A synchronous nf() miss ALSO kicks one background load; register an
//   onGlyphIndex(cb) hook to re-render when it lands.

const NERD_INDEX = {
  // ── Font Awesome (fa-) · classic, stable codepoints ───────────────────────
  "fa-github": "f09b", "fa-gitlab": "f296", "fa-bitbucket": "f171",
  "fa-google": "f1a0", "fa-slack": "f198", "fa-microsoft": "f3ca",
  "fa-windows": "f17a", "fa-apple": "f179", "fa-linux": "f17c",
  "fa-android": "f17b", "fa-aws": "f375",
  "fa-database": "f1c0", "fa-server": "f233", "fa-hdd": "f0a0",
  "fa-cloud": "f0c2", "fa-cloud_upload": "f0ee", "fa-cloud_download": "f0ed",
  "fa-terminal": "f120", "fa-code": "f121", "fa-cog": "f013", "fa-cogs": "f085",
  "fa-wrench": "f0ad", "fa-bug": "f188", "fa-rocket": "f135", "fa-bolt": "f0e7",
  "fa-lock": "f023", "fa-unlock": "f09c", "fa-key": "f084", "fa-shield": "f132",
  "fa-folder": "f07b", "fa-folder_open": "f07c", "fa-file": "f15b",
  "fa-file_text": "f0f6", "fa-home": "f015", "fa-user": "f007", "fa-users": "f0c0",
  "fa-globe": "f0ac", "fa-envelope": "f0e0", "fa-bell": "f0f3", "fa-star": "f005",
  "fa-heart": "f004", "fa-search": "f002", "fa-tag": "f02b", "fa-tags": "f02c",
  "fa-clock": "f017", "fa-calendar": "f073", "fa-download": "f019",
  "fa-upload": "f093", "fa-refresh": "f021", "fa-trash": "f1f8",
  "fa-check": "f00c", "fa-times": "f00d", "fa-plus": "f067", "fa-minus": "f068",
  "fa-info": "f129", "fa-question": "f128", "fa-exclamation": "f12a",
  "fa-warning": "f071", "fa-power_off": "f011", "fa-play": "f04b",
  "fa-pause": "f04c", "fa-stop": "f04d", "fa-link": "f0c1", "fa-eye": "f06e",
  "fa-filter": "f0b0", "fa-flag": "f024", "fa-bookmark": "f02e",
  "fa-comment": "f075", "fa-microchip": "f2db", "fa-wifi": "f1eb",
  "fa-bluetooth": "f293", "fa-battery": "f240", "fa-fire": "f06d",
  "fa-leaf": "f06c", "fa-music": "f001", "fa-camera": "f030", "fa-image": "f03e",
  "fa-video": "f03d", "fa-map": "f279", "fa-location": "f041", "fa-phone": "f095",
  "fa-desktop": "f108", "fa-laptop": "f109", "fa-mobile": "f10b",
  "fa-tablet": "f10a", "fa-print": "f02f", "fa-save": "f0c7", "fa-edit": "f044",
  "fa-copy": "f0c5", "fa-cut": "f0c4", "fa-paste": "f0ea",
  "fa-file_o": "f016", "fa-file_pdf": "f1c1", "fa-file_image": "f1c5",
  "fa-file_archive": "f1c6", "fa-beer": "f0fc",
  "fa-twitter": "f099", "fa-facebook": "f09a", "fa-youtube": "f167",
  "fa-linkedin": "f08c", "fa-reddit": "f1a1", "fa-instagram": "f16d",
  "fa-whatsapp": "f232", "fa-discord": "f392", "fa-telegram": "f2c6",
  "fa-mastodon": "f4f6",

  // ── Devicons (dev-) · language & tool logos ───────────────────────────────
  "dev-git": "e702", "dev-git_branch": "e725", "dev-python": "e73c",
  "dev-php": "e73d", "dev-laravel": "e73f", "dev-rust": "e7a8",
  "dev-react": "e7ba", "dev-nodejs_small": "e718", "dev-npm": "e71e",
  "dev-java": "e738", "dev-ruby": "e739", "dev-go": "e724", "dev-mysql": "e704",
  "dev-postgresql": "e76e", "dev-redis": "e76d", "dev-mongodb": "e7a4",
  "dev-sqllite": "e7c4", "dev-vim": "e7c5", "dev-sublime": "e7aa",
  "dev-visualstudio": "e70c", "dev-html5": "e736", "dev-css3": "e749",
  "dev-angular": "e753", "dev-django": "e71d", "dev-rails": "e73b",
  "dev-dotnet": "e77f", "dev-bootstrap": "e747", "dev-jquery": "e750",
  "dev-svelte": "e697", "dev-yarn": "e6a7", "dev-composer": "e683",

  // ── Seti-UI (seti-) · file-type icons ─────────────────────────────────────
  "seti-typescript": "e628", "seti-javascript": "e60c", "seti-json": "e60b",
  "seti-html": "e60e", "seti-css": "e614", "seti-markdown": "e609",
  "seti-go": "e627", "seti-c": "e61e", "seti-cpp": "e61d", "seti-vue": "e6a0",
  "seti-config": "e615",

  // ── Powerline (pl-) · prompt separators & symbols ─────────────────────────
  "pl-left_hard_divider": "e0b0", "pl-left_soft_divider": "e0b1",
  "pl-right_hard_divider": "e0b2", "pl-right_soft_divider": "e0b3",
  "pl-branch": "e0a0", "pl-line_number": "e0a1", "pl-readonly": "e0a2",
};

// Source prefixes present in the seed → human label (for the picker's filter).
const NERD_INDEX_SOURCES = {
  "fa":      "Font Awesome",
  "dev":     "Devicons",
  "seti":    "Seti-UI",
  "pl":      "Powerline",
  "cod":     "Codicons",
  "oct":     "Octicons",
  "md":      "Material Design",
  "weather": "Weather",
};

const NERD_INDEX_META = {
  seed: true,
  count: Object.keys(NERD_INDEX).length,
  full_count_note: "production index is generated from upstream glyphnames.json (~10k)",
};

Object.assign(window, { NERD_INDEX, NERD_INDEX_SOURCES, NERD_INDEX_META });

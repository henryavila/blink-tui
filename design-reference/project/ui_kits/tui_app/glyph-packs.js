// glyph-packs.js — blink CURATED glyph packs (Tier 1 + Tier 2).
//
// Every entry here is FULLY CURATED: a Nerd Font codepoint, a `unicode`
// fallback, an `ascii` fallback, and a semantic `color`. That curation is the
// product — it can't be auto-derived — so these packs are hand-maintained and
// small. None is registered automatically; an app opts in:
//
//     registerGlyphs(COMMON_DOMAINS);          // Tier 1 — the usual suspects
//     registerGlyphs(LANGUAGES, DATABASES);    // Tier 2 — only what you use
//     registerGlyphs({ database: { color:'var(--domain-cyan)' } }); // override one
//
// Packs may overlap on a name (apple lives in OS and COMPANIES; docker in CLOUD
// and COMMON). That's fine — registerGlyphs merges, last write wins, so compose
// freely and override the few you care about.
//
// Codepoints are Nerd Font PUA values. They render from the terminal font, not
// from blink. Where a codepoint is uncertain on a given build, the {unicode,
// ascii} fallback keeps the glyph legible — that's the whole point of the chain.

// ── Tier 1 · COMMON_DOMAINS — the dev-tool domains most TUIs reuse ───────────
const COMMON_DOMAINS = {
  database:   { nerd: "\uf1c0", unicode: "▤", ascii: "db",  color: "var(--fg-muted)" },
  mysql:      { nerd: "\ue704", unicode: "▤", ascii: "my",  color: "var(--domain-azure)" },
  postgresql: { nerd: "\ue76e", unicode: "▤", ascii: "pg",  color: "var(--domain-blue)" },
  redis:      { nerd: "\ue76d", unicode: "◆", ascii: "rd",  color: "var(--domain-red)" },
  docker:     { nerd: "\uf308", unicode: "▦", ascii: "dk",  color: "var(--domain-cyan)" },
  github:     { nerd: "\uf09b", unicode: "◉", ascii: "gh",  color: "var(--fg-muted)" },
  git:        { nerd: "\ue702", unicode: "◈", ascii: "gt",  color: "var(--domain-amber)" },
  ssh:        { nerd: "\uf015", unicode: "⌂", ascii: "sh",  color: "var(--domain-yellow)" },
  nodejs:     { nerd: "\ue718", unicode: "❖", ascii: "nd",  color: "var(--domain-green)" },
  php:        { nerd: "\ue73d", unicode: "❮", ascii: "ph",  color: "var(--domain-violet)" },
  python:     { nerd: "\ue73c", unicode: "❯", ascii: "py",  color: "var(--domain-yellow)" },
  vim:        { nerd: "\ue7c5", unicode: "✱", ascii: "vi",  color: "var(--domain-green)" },
  apple:      { nerd: "\uf179", unicode: "", ascii: "mac", color: "var(--fg-muted)" },
  linux:      { nerd: "\uf17c", unicode: "△", ascii: "lx",  color: "var(--domain-yellow)" },
  ubuntu:     { nerd: "\uf31b", unicode: "○", ascii: "ub",  color: "var(--domain-amber)" },
  font:       { nerd: "\uf031", unicode: "ƒ", ascii: "ft",  color: "var(--fg-muted)" },
  ai:         { nerd: "\uf2db", unicode: "▚", ascii: "ai",  color: "var(--accent)" },
  bolt:       { nerd: "\uf0e7", unicode: "⚡", ascii: "!",   color: "var(--domain-amber)" },
};

// ── Tier 2 · category packs ──────────────────────────────────────────────────

// languages — programming languages / runtimes
const LANGUAGES = {
  javascript: { nerd: "\ue60c", unicode: "◆", ascii: "js", color: "var(--domain-yellow)" },
  typescript: { nerd: "\ue628", unicode: "◆", ascii: "ts", color: "var(--domain-blue)" },
  python:     { nerd: "\ue73c", unicode: "❯", ascii: "py", color: "var(--domain-yellow)" },
  php:        { nerd: "\ue73d", unicode: "❮", ascii: "ph", color: "var(--domain-violet)" },
  ruby:       { nerd: "\ue739", unicode: "◆", ascii: "rb", color: "var(--domain-red)" },
  rust:       { nerd: "\ue7a8", unicode: "◆", ascii: "rs", color: "var(--domain-amber)" },
  go:         { nerd: "\ue627", unicode: "◆", ascii: "go", color: "var(--domain-cyan)" },
  java:       { nerd: "\ue738", unicode: "◆", ascii: "jv", color: "var(--domain-amber)" },
  nodejs:     { nerd: "\ue718", unicode: "❖", ascii: "nd", color: "var(--domain-green)" },
  cpp:        { nerd: "\ue61d", unicode: "◆", ascii: "c+", color: "var(--domain-blue)" },
  c:          { nerd: "\ue61e", unicode: "◆", ascii: "c",  color: "var(--domain-blue)" },
  csharp:     { nerd: "\ue648", unicode: "◆", ascii: "c#", color: "var(--domain-violet)" },
  html:       { nerd: "\ue60e", unicode: "◆", ascii: "ht", color: "var(--domain-amber)" },
  css:        { nerd: "\ue614", unicode: "◆", ascii: "cs", color: "var(--domain-blue)" },
  react:      { nerd: "\ue7ba", unicode: "◆", ascii: "rx", color: "var(--domain-cyan)" },
  vue:        { nerd: "\ue6a0", unicode: "◆", ascii: "vu", color: "var(--domain-green)" },
};

// databases — engines & stores
const DATABASES = {
  database:   { nerd: "\uf1c0", unicode: "▤", ascii: "db", color: "var(--fg-muted)" },
  postgresql: { nerd: "\ue76e", unicode: "▤", ascii: "pg", color: "var(--domain-blue)" },
  mysql:      { nerd: "\ue704", unicode: "▤", ascii: "my", color: "var(--domain-azure)" },
  mariadb:    { nerd: "\uf1c0", unicode: "▤", ascii: "mb", color: "var(--domain-azure)" },
  redis:      { nerd: "\ue76d", unicode: "◆", ascii: "rd", color: "var(--domain-red)" },
  mongodb:    { nerd: "\ue7a4", unicode: "◆", ascii: "mg", color: "var(--domain-green)" },
  sqlite:     { nerd: "\ue7c4", unicode: "▤", ascii: "sq", color: "var(--domain-blue)" },
};

// cloud — cloud / devops / infra
const CLOUD = {
  aws:        { nerd: "\uf375", unicode: "◆", ascii: "aws", color: "var(--domain-amber)" },
  cloud:      { nerd: "\uf0c2", unicode: "☁", ascii: "cl",  color: "var(--domain-cyan)" },
  server:     { nerd: "\uf233", unicode: "▤", ascii: "srv", color: "var(--fg-muted)" },
  docker:     { nerd: "\uf308", unicode: "▦", ascii: "dk",  color: "var(--domain-cyan)" },
  kubernetes: { nerd: "\ue81d", unicode: "◆", ascii: "k8",  color: "var(--domain-blue)" },
  nginx:      { nerd: "\ue776", unicode: "◆", ascii: "ng",  color: "var(--domain-green)" },
};

// editors — editors / IDEs
const EDITORS = {
  vim:      { nerd: "\ue7c5", unicode: "✱", ascii: "vi", color: "var(--domain-green)" },
  neovim:   { nerd: "\ue7c5", unicode: "✱", ascii: "nv", color: "var(--domain-green)" },
  vscode:   { nerd: "\ue70c", unicode: "◆", ascii: "vc", color: "var(--domain-blue)" },
  sublime:  { nerd: "\ue7aa", unicode: "◆", ascii: "su", color: "var(--domain-amber)" },
  emacs:    { nerd: "\ue632", unicode: "◆", ascii: "em", color: "var(--domain-violet)" },
};

// os — operating systems / distros
const OS = {
  apple:   { nerd: "\uf179", unicode: "", ascii: "mac", color: "var(--fg-muted)" },
  linux:   { nerd: "\uf17c", unicode: "△", ascii: "lx",  color: "var(--domain-yellow)" },
  ubuntu:  { nerd: "\uf31b", unicode: "○", ascii: "ub",  color: "var(--domain-amber)" },
  debian:  { nerd: "\uf306", unicode: "◆", ascii: "dn",  color: "var(--domain-red)" },
  arch:    { nerd: "\uf303", unicode: "△", ascii: "ar",  color: "var(--domain-blue)" },
  fedora:  { nerd: "\uf30a", unicode: "◆", ascii: "fd",  color: "var(--domain-blue)" },
  windows: { nerd: "\uf17a", unicode: "▦", ascii: "win", color: "var(--domain-cyan)" },
  android: { nerd: "\uf17b", unicode: "◆", ascii: "an",  color: "var(--domain-green)" },
};

// companies — brands / vendors
const COMPANIES = {
  github:    { nerd: "\uf09b", unicode: "◉", ascii: "gh", color: "var(--fg-muted)" },
  gitlab:    { nerd: "\uf296", unicode: "◆", ascii: "gl", color: "var(--domain-amber)" },
  bitbucket: { nerd: "\uf171", unicode: "◆", ascii: "bb", color: "var(--domain-blue)" },
  google:    { nerd: "\uf1a0", unicode: "◉", ascii: "go", color: "var(--domain-blue)" },
  microsoft: { nerd: "\uf3ca", unicode: "▦", ascii: "ms", color: "var(--domain-cyan)" },
  apple:     { nerd: "\uf179", unicode: "", ascii: "ap", color: "var(--fg-muted)" },
  slack:     { nerd: "\uf198", unicode: "◆", ascii: "sl", color: "var(--domain-violet)" },
  npm:       { nerd: "\ue71e", unicode: "◆", ascii: "np", color: "var(--domain-red)" },
  git:       { nerd: "\ue702", unicode: "◈", ascii: "gt", color: "var(--domain-amber)" },
};

// frameworks — web / app frameworks
const FRAMEWORKS = {
  react:     { nerd: "\ue7ba", unicode: "◆", ascii: "rx",  color: "var(--domain-cyan)" },
  vue:       { nerd: "\ue6a0", unicode: "◆", ascii: "vu",  color: "var(--domain-green)" },
  angular:   { nerd: "\ue753", unicode: "◆", ascii: "ng",  color: "var(--domain-red)" },
  svelte:    { nerd: "\ue697", unicode: "◆", ascii: "sv",  color: "var(--domain-amber)" },
  laravel:   { nerd: "\ue73f", unicode: "◆", ascii: "lv",  color: "var(--domain-red)" },
  django:    { nerd: "\ue71d", unicode: "◆", ascii: "dj",  color: "var(--domain-green)" },
  rails:     { nerd: "\ue73b", unicode: "◆", ascii: "rr",  color: "var(--domain-red)" },
  dotnet:    { nerd: "\ue77f", unicode: "◆", ascii: "net", color: "var(--domain-violet)" },
  bootstrap: { nerd: "\ue747", unicode: "◆", ascii: "bs",  color: "var(--domain-violet)" },
  jquery:    { nerd: "\ue750", unicode: "◆", ascii: "jq",  color: "var(--domain-blue)" },
};

// files — files & formats
const FILES = {
  file:        { nerd: "\uf15b", unicode: "▢", ascii: "fl",  color: "var(--fg-muted)" },
  folder:      { nerd: "\uf07b", unicode: "▤", ascii: "dir", color: "var(--domain-blue)" },
  folder_open: { nerd: "\uf07c", unicode: "▤", ascii: "dir", color: "var(--domain-blue)" },
  json:        { nerd: "\ue60b", unicode: "◆", ascii: "js",  color: "var(--domain-yellow)" },
  yaml:        { nerd: "\ue615", unicode: "◆", ascii: "yml", color: "var(--domain-amber)" },
  markdown:    { nerd: "\ue609", unicode: "◆", ascii: "md",  color: "var(--fg-muted)" },
  pdf:         { nerd: "\uf1c1", unicode: "▢", ascii: "pdf", color: "var(--domain-red)" },
  image:       { nerd: "\uf1c5", unicode: "▢", ascii: "img", color: "var(--domain-green)" },
  archive:     { nerd: "\uf1c6", unicode: "▢", ascii: "zip", color: "var(--domain-amber)" },
  lock:        { nerd: "\uf023", unicode: "⌂", ascii: "lk",  color: "var(--domain-yellow)" },
};

// social — social & messaging brands
const SOCIAL = {
  slack:    { nerd: "\uf198", unicode: "◆", ascii: "sl", color: "var(--domain-violet)" },
  discord:  { nerd: "\uf392", unicode: "◆", ascii: "dc", color: "var(--domain-blue)" },
  telegram: { nerd: "\uf2c6", unicode: "◆", ascii: "tg", color: "var(--domain-cyan)" },
  twitter:  { nerd: "\uf099", unicode: "◆", ascii: "tw", color: "var(--domain-cyan)" },
  youtube:  { nerd: "\uf167", unicode: "◆", ascii: "yt", color: "var(--domain-red)" },
  linkedin: { nerd: "\uf08c", unicode: "◆", ascii: "in", color: "var(--domain-blue)" },
  reddit:   { nerd: "\uf1a1", unicode: "◆", ascii: "rd", color: "var(--domain-amber)" },
  mastodon: { nerd: "\uf4f6", unicode: "◆", ascii: "md", color: "var(--domain-violet)" },
};

// actions — generic UI action glyphs (not in the Tier 0 contract)
const ACTIONS = {
  search:   { nerd: "\uf002", unicode: "◎", ascii: "?",  color: "var(--fg-muted)" },
  filter:   { nerd: "\uf0b0", unicode: "▽", ascii: "fi", color: "var(--fg-muted)" },
  settings: { nerd: "\uf013", unicode: "✦", ascii: "cf", color: "var(--fg-muted)" },
  trash:    { nerd: "\uf1f8", unicode: "✗", ascii: "rm", color: "var(--state-err)" },
  download: { nerd: "\uf019", unicode: "▼", ascii: "dl", color: "var(--domain-blue)" },
  upload:   { nerd: "\uf093", unicode: "▲", ascii: "ul", color: "var(--domain-blue)" },
  refresh:  { nerd: "\uf021", unicode: "↻", ascii: "rf", color: "var(--state-info)" },
  edit:     { nerd: "\uf044", unicode: "✎", ascii: "ed", color: "var(--fg-muted)" },
  bell:     { nerd: "\uf0f3", unicode: "◔", ascii: "nt", color: "var(--domain-yellow)" },
  link:     { nerd: "\uf0c1", unicode: "∞", ascii: "ln", color: "var(--link)" },
};

// packages — package managers
const PACKAGES = {
  npm:      { nerd: "\ue71e", unicode: "◆", ascii: "np", color: "var(--domain-red)" },
  yarn:     { nerd: "\ue6a7", unicode: "◆", ascii: "yn", color: "var(--domain-blue)" },
  cargo:    { nerd: "\ue7a8", unicode: "◆", ascii: "cg", color: "var(--domain-amber)" },
  pip:      { nerd: "\ue73c", unicode: "◆", ascii: "pp", color: "var(--domain-yellow)" },
  composer: { nerd: "\ue683", unicode: "◆", ascii: "co", color: "var(--domain-yellow)" },
  homebrew: { nerd: "\uf0fc", unicode: "◆", ascii: "br", color: "var(--domain-yellow)" },
  apt:      { nerd: "\uf306", unicode: "◆", ascii: "ap", color: "var(--domain-red)" },
};

// devinfra — recurring local dev-infrastructure tools. These showed up often
// enough as raw nf() registrations in apps to earn CURATED entries (the bar for
// Tier 2). `laravel` is promoted from FRAMEWORKS and `valet` aliases its glyph;
// `code-server` aliases the vscode/visualstudio family from EDITORS. The genuine
// newcomers — tailscale / syncthing / mosh — carry safe {unicode, ascii}
// fallbacks so they never tofu on a terminal without Nerd Fonts; their `nerd`
// codepoints are left for a curator to verify (mark: verify).
//
// PRIME DIRECTIVE still holds: this pack is OPT-IN content, registered by no
// app automatically. A one-app-only glyph stays in that app — these are here
// because they recur, not to make every app carry them.
const DEVINFRA = {
  laravel:       { nerd: "\ue73f", unicode: "◆", ascii: "[lv]", color: "var(--domain-red)" },    // promoted from FRAMEWORKS
  valet:         { nerd: "\ue73f", unicode: "◆", ascii: "[va]", color: "var(--domain-red)" },    // laravel valet (alias glyph)
  "code-server": { nerd: "\ue70c", unicode: "◆", ascii: "[cs]", color: "var(--domain-blue)" },   // vscode family (EDITORS)
  ngrok:         { nerd: "\uf0e7", unicode: "⚡", ascii: "[ng]", color: "var(--domain-amber)" },  // fa-bolt
  mailpit:       { nerd: "\uf0e0", unicode: "✉", ascii: "[mp]", color: "var(--domain-amber)" },  // fa-envelope
  tailscale:     {                 unicode: "◆", ascii: "[ts]", color: "var(--domain-cyan)" },    // nerd: verify
  syncthing:     {                 unicode: "↻", ascii: "[st]", color: "var(--domain-violet)" },  // nerd: verify
  mosh:          {                 unicode: "◆", ascii: "[mo]", color: "var(--domain-amber)" },   // nerd: verify (fa-bolt / custom)
};

// Pack directory — used by the picker / docs to label & iterate Tier 2.
const GLYPH_PACKS = {
  languages:  LANGUAGES,
  databases:  DATABASES,
  cloud:      CLOUD,
  editors:    EDITORS,
  os:         OS,
  companies:  COMPANIES,
  frameworks: FRAMEWORKS,
  files:      FILES,
  social:     SOCIAL,
  actions:    ACTIONS,
  packages:   PACKAGES,
  devinfra:   DEVINFRA,
};

Object.assign(window, {
  COMMON_DOMAINS,
  LANGUAGES, DATABASES, CLOUD, EDITORS, OS, COMPANIES,
  FRAMEWORKS, FILES, SOCIAL, ACTIONS, PACKAGES, DEVINFRA,
  GLYPH_PACKS,
});

import type { GlyphVariants } from './types.js';

/**
 * blink curated glyph packs (Tier 1 + Tier 2).
 *
 * Every entry here is FULLY CURATED: a Nerd Font codepoint, a `unicode`
 * fallback, an `ascii` fallback, and a semantic `color` (a domain hue-family
 * token, so it recolours with the active theme). That curation is the product —
 * it can't be auto-derived — so the packs are hand-maintained and small. **None
 * is registered automatically**; an app opts in:
 *
 * ```ts
 * registerGlyphs(COMMON_DOMAINS);        // Tier 1 — the usual suspects
 * registerGlyphs(LANGUAGES, DATABASES);  // Tier 2 — only what you use
 * registerGlyphs({ database: { color: 'domainCyan' } }); // override one
 * ```
 *
 * Packs may overlap on a name (apple lives in OS and COMPANIES; docker in CLOUD
 * and COMMON). That's fine — `registerGlyphs` merges, last write wins, so compose
 * freely and override the few you care about.
 *
 * Codepoints are Nerd Font private-use values; they render from the terminal
 * font, not from blink. Where a codepoint is uncertain on a given build, the
 * `{ unicode, ascii }` fallback keeps the glyph legible — the whole point of the
 * fallback chain.
 */

/** Nerd Font char from a hex codepoint — keeps the tables readable. */
const cp = (hex: string): string => String.fromCodePoint(parseInt(hex, 16));

/** Tier 1 · COMMON_DOMAINS — the dev-tool domains most TUIs reuse. */
export const COMMON_DOMAINS = {
  database: { nerd: cp('f1c0'), unicode: '▤', ascii: 'db', color: 'domainNeutral' },
  mysql: { nerd: cp('e704'), unicode: '▤', ascii: 'my', color: 'domainAzure' },
  postgresql: { nerd: cp('e76e'), unicode: '▤', ascii: 'pg', color: 'domainBlue' },
  redis: { nerd: cp('e76d'), unicode: '◆', ascii: 'rd', color: 'domainRed' },
  docker: { nerd: cp('f308'), unicode: '▦', ascii: 'dk', color: 'domainCyan' },
  github: { nerd: cp('f09b'), unicode: '◉', ascii: 'gh', color: 'domainNeutral' },
  git: { nerd: cp('e702'), unicode: '◈', ascii: 'gt', color: 'domainAmber' },
  ssh: { nerd: cp('f015'), unicode: '⌂', ascii: 'sh', color: 'domainYellow' },
  nodejs: { nerd: cp('e718'), unicode: '❖', ascii: 'nd', color: 'domainGreen' },
  php: { nerd: cp('e73d'), unicode: '❮', ascii: 'ph', color: 'domainViolet' },
  python: { nerd: cp('e73c'), unicode: '❯', ascii: 'py', color: 'domainYellow' },
  vim: { nerd: cp('e7c5'), unicode: '✱', ascii: 'vi', color: 'domainGreen' },
  apple: { nerd: cp('f179'), unicode: '◇', ascii: 'mac', color: 'domainNeutral' },
  linux: { nerd: cp('f17c'), unicode: '△', ascii: 'lx', color: 'domainYellow' },
  ubuntu: { nerd: cp('f31b'), unicode: '○', ascii: 'ub', color: 'domainAmber' },
  font: { nerd: cp('f031'), unicode: 'ƒ', ascii: 'ft', color: 'domainNeutral' },
  ai: { nerd: cp('f2db'), unicode: '▚', ascii: 'ai', color: 'accent' },
  // ↯ (single-cell) over the design system's ⚡, which is emoji-presentation and
  // double-wide — it would break the character cell in unicode mode.
  bolt: { nerd: cp('f0e7'), unicode: '↯', ascii: '!', color: 'domainAmber' },
} satisfies Record<string, GlyphVariants>;

/** A domain name from the {@link COMMON_DOMAINS} (Tier 1) pack. */
export type CommonDomainName = keyof typeof COMMON_DOMAINS;

// ── Tier 2 · category packs ──────────────────────────────────────────────────

/** languages — programming languages / runtimes. */
export const LANGUAGES = {
  javascript: { nerd: cp('e60c'), unicode: '◆', ascii: 'js', color: 'domainYellow' },
  typescript: { nerd: cp('e628'), unicode: '◆', ascii: 'ts', color: 'domainBlue' },
  python: { nerd: cp('e73c'), unicode: '❯', ascii: 'py', color: 'domainYellow' },
  php: { nerd: cp('e73d'), unicode: '❮', ascii: 'ph', color: 'domainViolet' },
  ruby: { nerd: cp('e739'), unicode: '◆', ascii: 'rb', color: 'domainRed' },
  rust: { nerd: cp('e7a8'), unicode: '◆', ascii: 'rs', color: 'domainAmber' },
  go: { nerd: cp('e627'), unicode: '◆', ascii: 'go', color: 'domainCyan' },
  java: { nerd: cp('e738'), unicode: '◆', ascii: 'jv', color: 'domainAmber' },
  nodejs: { nerd: cp('e718'), unicode: '❖', ascii: 'nd', color: 'domainGreen' },
  cpp: { nerd: cp('e61d'), unicode: '◆', ascii: 'c+', color: 'domainBlue' },
  c: { nerd: cp('e61e'), unicode: '◆', ascii: 'c', color: 'domainBlue' },
  csharp: { nerd: cp('e648'), unicode: '◆', ascii: 'c#', color: 'domainViolet' },
  html: { nerd: cp('e60e'), unicode: '◆', ascii: 'ht', color: 'domainAmber' },
  css: { nerd: cp('e614'), unicode: '◆', ascii: 'cs', color: 'domainBlue' },
  react: { nerd: cp('e7ba'), unicode: '◆', ascii: 'rx', color: 'domainCyan' },
  vue: { nerd: cp('e6a0'), unicode: '◆', ascii: 'vu', color: 'domainGreen' },
} satisfies Record<string, GlyphVariants>;

/** databases — engines & stores. */
export const DATABASES = {
  database: { nerd: cp('f1c0'), unicode: '▤', ascii: 'db', color: 'domainNeutral' },
  postgresql: { nerd: cp('e76e'), unicode: '▤', ascii: 'pg', color: 'domainBlue' },
  mysql: { nerd: cp('e704'), unicode: '▤', ascii: 'my', color: 'domainAzure' },
  mariadb: { nerd: cp('f1c0'), unicode: '▤', ascii: 'mb', color: 'domainAzure' },
  redis: { nerd: cp('e76d'), unicode: '◆', ascii: 'rd', color: 'domainRed' },
  mongodb: { nerd: cp('e7a4'), unicode: '◆', ascii: 'mg', color: 'domainGreen' },
  sqlite: { nerd: cp('e7c4'), unicode: '▤', ascii: 'sq', color: 'domainBlue' },
} satisfies Record<string, GlyphVariants>;

/** cloud — cloud / devops / infra. */
export const CLOUD = {
  aws: { nerd: cp('f375'), unicode: '◆', ascii: 'aws', color: 'domainAmber' },
  cloud: { nerd: cp('f0c2'), unicode: '◌', ascii: 'cl', color: 'domainCyan' }, // ◌ over the double-wide ☁ (same width-1 rule as bolt/ngrok/mailpit)
  server: { nerd: cp('f233'), unicode: '▤', ascii: 'srv', color: 'domainNeutral' },
  docker: { nerd: cp('f308'), unicode: '▦', ascii: 'dk', color: 'domainCyan' },
  kubernetes: { nerd: cp('e81d'), unicode: '◆', ascii: 'k8', color: 'domainBlue' },
  nginx: { nerd: cp('e776'), unicode: '◆', ascii: 'ng', color: 'domainGreen' },
} satisfies Record<string, GlyphVariants>;

/** editors — editors / IDEs. */
export const EDITORS = {
  vim: { nerd: cp('e7c5'), unicode: '✱', ascii: 'vi', color: 'domainGreen' },
  neovim: { nerd: cp('e7c5'), unicode: '✱', ascii: 'nv', color: 'domainGreen' },
  vscode: { nerd: cp('e70c'), unicode: '◆', ascii: 'vc', color: 'domainBlue' },
  sublime: { nerd: cp('e7aa'), unicode: '◆', ascii: 'su', color: 'domainAmber' },
  emacs: { nerd: cp('e632'), unicode: '◆', ascii: 'em', color: 'domainViolet' },
} satisfies Record<string, GlyphVariants>;

/** os — operating systems / distros. */
export const OS = {
  apple: { nerd: cp('f179'), unicode: '◇', ascii: 'mac', color: 'domainNeutral' },
  linux: { nerd: cp('f17c'), unicode: '△', ascii: 'lx', color: 'domainYellow' },
  ubuntu: { nerd: cp('f31b'), unicode: '○', ascii: 'ub', color: 'domainAmber' },
  debian: { nerd: cp('f306'), unicode: '◆', ascii: 'dn', color: 'domainRed' },
  arch: { nerd: cp('f303'), unicode: '△', ascii: 'ar', color: 'domainBlue' },
  fedora: { nerd: cp('f30a'), unicode: '◆', ascii: 'fd', color: 'domainBlue' },
  windows: { nerd: cp('f17a'), unicode: '▦', ascii: 'win', color: 'domainCyan' },
  android: { nerd: cp('f17b'), unicode: '◆', ascii: 'an', color: 'domainGreen' },
} satisfies Record<string, GlyphVariants>;

/** companies — brands / vendors. */
export const COMPANIES = {
  github: { nerd: cp('f09b'), unicode: '◉', ascii: 'gh', color: 'domainNeutral' },
  gitlab: { nerd: cp('f296'), unicode: '◆', ascii: 'gl', color: 'domainAmber' },
  bitbucket: { nerd: cp('f171'), unicode: '◆', ascii: 'bb', color: 'domainBlue' },
  google: { nerd: cp('f1a0'), unicode: '◉', ascii: 'go', color: 'domainBlue' },
  microsoft: { nerd: cp('f3ca'), unicode: '▦', ascii: 'ms', color: 'domainCyan' },
  apple: { nerd: cp('f179'), unicode: '◇', ascii: 'ap', color: 'domainNeutral' },
  slack: { nerd: cp('f198'), unicode: '◆', ascii: 'sl', color: 'domainViolet' },
  npm: { nerd: cp('e71e'), unicode: '◆', ascii: 'np', color: 'domainRed' },
  git: { nerd: cp('e702'), unicode: '◈', ascii: 'gt', color: 'domainAmber' },
  // Anthropic / Claude — no verified Nerd Font codepoint, so `nerd` is left empty
  // and the glyph degrades to ✶ (a width-1 sunburst, evoking the Claude mark);
  // accent = the brand lavender. Same empty-nerd→unicode pattern as DEVINFRA's
  // tailscale/syncthing/mosh. A curator can fill `nerd` if a glyph is verified.
  claude: { nerd: '', unicode: '✶', ascii: 'cl', color: 'accent' },
} satisfies Record<string, GlyphVariants>;

/** frameworks — web / app frameworks. */
export const FRAMEWORKS = {
  react: { nerd: cp('e7ba'), unicode: '◆', ascii: 'rx', color: 'domainCyan' },
  vue: { nerd: cp('e6a0'), unicode: '◆', ascii: 'vu', color: 'domainGreen' },
  angular: { nerd: cp('e753'), unicode: '◆', ascii: 'ng', color: 'domainRed' },
  svelte: { nerd: cp('e697'), unicode: '◆', ascii: 'sv', color: 'domainAmber' },
  laravel: { nerd: cp('e73f'), unicode: '◆', ascii: 'lv', color: 'domainRed' },
  django: { nerd: cp('e71d'), unicode: '◆', ascii: 'dj', color: 'domainGreen' },
  rails: { nerd: cp('e73b'), unicode: '◆', ascii: 'rr', color: 'domainRed' },
  dotnet: { nerd: cp('e77f'), unicode: '◆', ascii: 'net', color: 'domainViolet' },
  bootstrap: { nerd: cp('e747'), unicode: '◆', ascii: 'bs', color: 'domainViolet' },
  jquery: { nerd: cp('e750'), unicode: '◆', ascii: 'jq', color: 'domainBlue' },
} satisfies Record<string, GlyphVariants>;

/** files — files & formats. */
export const FILES = {
  file: { nerd: cp('f15b'), unicode: '▢', ascii: 'fl', color: 'domainNeutral' },
  folder: { nerd: cp('f07b'), unicode: '▤', ascii: 'dir', color: 'domainBlue' },
  folder_open: { nerd: cp('f07c'), unicode: '▤', ascii: 'dir', color: 'domainBlue' },
  json: { nerd: cp('e60b'), unicode: '◆', ascii: 'js', color: 'domainYellow' },
  yaml: { nerd: cp('e615'), unicode: '◆', ascii: 'yml', color: 'domainAmber' },
  markdown: { nerd: cp('e609'), unicode: '◆', ascii: 'md', color: 'domainNeutral' },
  pdf: { nerd: cp('f1c1'), unicode: '▢', ascii: 'pdf', color: 'domainRed' },
  image: { nerd: cp('f1c5'), unicode: '▢', ascii: 'img', color: 'domainGreen' },
  archive: { nerd: cp('f1c6'), unicode: '▢', ascii: 'zip', color: 'domainAmber' },
  lock: { nerd: cp('f023'), unicode: '⌂', ascii: 'lk', color: 'domainYellow' },
} satisfies Record<string, GlyphVariants>;

/** social — social & messaging brands. */
export const SOCIAL = {
  slack: { nerd: cp('f198'), unicode: '◆', ascii: 'sl', color: 'domainViolet' },
  discord: { nerd: cp('f392'), unicode: '◆', ascii: 'dc', color: 'domainBlue' },
  telegram: { nerd: cp('f2c6'), unicode: '◆', ascii: 'tg', color: 'domainCyan' },
  twitter: { nerd: cp('f099'), unicode: '◆', ascii: 'tw', color: 'domainCyan' },
  youtube: { nerd: cp('f167'), unicode: '◆', ascii: 'yt', color: 'domainRed' },
  linkedin: { nerd: cp('f08c'), unicode: '◆', ascii: 'in', color: 'domainBlue' },
  reddit: { nerd: cp('f1a1'), unicode: '◆', ascii: 'rd', color: 'domainAmber' },
  mastodon: { nerd: cp('f4f6'), unicode: '◆', ascii: 'md', color: 'domainViolet' },
} satisfies Record<string, GlyphVariants>;

/** actions — generic UI action glyphs (not in the Tier 0 contract). */
export const ACTIONS = {
  search: { nerd: cp('f002'), unicode: '◎', ascii: '?', color: 'domainNeutral' },
  filter: { nerd: cp('f0b0'), unicode: '▽', ascii: 'fi', color: 'domainNeutral' },
  settings: { nerd: cp('f013'), unicode: '✦', ascii: 'cf', color: 'domainNeutral' },
  trash: { nerd: cp('f1f8'), unicode: '✗', ascii: 'rm', color: 'stateErr' },
  download: { nerd: cp('f019'), unicode: '▼', ascii: 'dl', color: 'domainBlue' },
  upload: { nerd: cp('f093'), unicode: '▲', ascii: 'ul', color: 'domainBlue' },
  refresh: { nerd: cp('f021'), unicode: '↻', ascii: 'rf', color: 'stateInfo' },
  edit: { nerd: cp('f044'), unicode: '✎', ascii: 'ed', color: 'domainNeutral' },
  bell: { nerd: cp('f0f3'), unicode: '◔', ascii: 'nt', color: 'domainYellow' },
  link: { nerd: cp('f0c1'), unicode: '∞', ascii: 'ln', color: 'link' },
} satisfies Record<string, GlyphVariants>;

/**
 * system — general-purpose system / OS / UI domain glyphs.
 *
 * The recurring "thing" glyphs that aren't a brand (→ {@link COMPANIES}), an
 * action verb (→ {@link ACTIONS}), or a file format (→ {@link FILES}): a
 * terminal, a globe, a home, a key, an envelope. Every `nerd` codepoint is a
 * classic Font Awesome value; each carries a width-1 `unicode` fallback
 * (verified via `string-width`) so it never tofus on a non–Nerd-Font terminal.
 */
export const SYSTEM = {
  terminal: { nerd: cp('f120'), unicode: '❯', ascii: 'tm', color: 'domainGreen' }, // fa-terminal
  code: { nerd: cp('f121'), unicode: '◇', ascii: 'cd', color: 'domainBlue' }, // fa-code
  globe: { nerd: cp('f0ac'), unicode: '◍', ascii: 'wb', color: 'domainCyan' }, // fa-globe
  home: { nerd: cp('f015'), unicode: '⌂', ascii: 'hm', color: 'domainNeutral' }, // fa-home
  key: { nerd: cp('f084'), unicode: '⚿', ascii: 'ky', color: 'domainYellow' }, // fa-key
  mail: { nerd: cp('f0e0'), unicode: '⊠', ascii: 'ml', color: 'domainBlue' }, // fa-envelope — ⊠ over the double-wide ✉
  phone: { nerd: cp('f095'), unicode: '☏', ascii: 'tel', color: 'domainGreen' }, // fa-phone — ☏ over the double-wide ☎
  package: { nerd: cp('f1b2'), unicode: '▦', ascii: 'pkg', color: 'domainAmber' }, // fa-cube
  sync: { nerd: cp('f021'), unicode: '↻', ascii: 'sy', color: 'domainCyan' }, // fa-refresh
  text: { nerd: cp('f0f6'), unicode: '▢', ascii: 'tx', color: 'domainNeutral' }, // fa-file-text
  tools: { nerd: cp('f0ad'), unicode: '✦', ascii: 'tl', color: 'domainNeutral' }, // fa-wrench
} satisfies Record<string, GlyphVariants>;

/** packages — package managers. */
export const PACKAGES = {
  npm: { nerd: cp('e71e'), unicode: '◆', ascii: 'np', color: 'domainRed' },
  yarn: { nerd: cp('e6a7'), unicode: '◆', ascii: 'yn', color: 'domainBlue' },
  cargo: { nerd: cp('e7a8'), unicode: '◆', ascii: 'cg', color: 'domainAmber' },
  pip: { nerd: cp('e73c'), unicode: '◆', ascii: 'pp', color: 'domainYellow' },
  composer: { nerd: cp('e683'), unicode: '◆', ascii: 'co', color: 'domainYellow' },
  homebrew: { nerd: cp('f0fc'), unicode: '◆', ascii: 'br', color: 'domainYellow' },
  apt: { nerd: cp('f306'), unicode: '◆', ascii: 'ap', color: 'domainRed' },
} satisfies Record<string, GlyphVariants>;

/**
 * devinfra — recurring local dev-infrastructure tools. These show up often
 * enough as raw `nf()` registrations in apps to earn CURATED entries (the bar
 * for Tier 2). `laravel` is promoted from {@link FRAMEWORKS} and `valet` aliases
 * its glyph; `code-server` aliases the vscode family from {@link EDITORS}. The
 * genuine newcomers — tailscale / syncthing / mosh — carry safe `{ unicode,
 * ascii }` fallbacks so they never tofu without a Nerd Font; their `nerd`
 * codepoint is left empty (a curator must verify it) and the glyph degrades to
 * its unicode form until then.
 *
 * PRIME DIRECTIVE still holds: this pack is OPT-IN content, registered by no app
 * automatically. A one-app-only glyph stays in that app — these are here because
 * they recur, not to make every app carry them.
 *
 * Two single-cell divergences from the design system, for the same reason as
 * {@link COMMON_DOMAINS} `bolt` (see also `glyphs/glyphs.ts`): the DS unicode
 * fallbacks `⚡` (ngrok) and `✉` (mailpit) are emoji-presentation and
 * double-wide — they break the one-glyph-one-cell grid in unicode mode. blink
 * substitutes the width-1 `↯` and `⊠`; `string-width` is the arbiter.
 */
export const DEVINFRA = {
  laravel: { nerd: cp('e73f'), unicode: '◆', ascii: 'lv', color: 'domainRed' }, // promoted from FRAMEWORKS
  valet: { nerd: cp('e73f'), unicode: '◆', ascii: 'va', color: 'domainRed' }, // laravel valet (alias glyph)
  'code-server': { nerd: cp('e70c'), unicode: '◆', ascii: 'cs', color: 'domainBlue' }, // vscode family (EDITORS)
  ngrok: { nerd: cp('f0e7'), unicode: '↯', ascii: 'ng', color: 'domainAmber' }, // fa-bolt — ↯ over the DS's double-wide ⚡
  mailpit: { nerd: cp('f0e0'), unicode: '⊠', ascii: 'mp', color: 'domainAmber' }, // fa-envelope — ⊠ over the DS's double-wide ✉
  tailscale: { nerd: '', unicode: '◆', ascii: 'ts', color: 'domainCyan' }, // nerd: verify → degrades to ◆
  syncthing: { nerd: '', unicode: '↻', ascii: 'st', color: 'domainViolet' }, // nerd: verify → degrades to ↻
  mosh: { nerd: '', unicode: '◆', ascii: 'mo', color: 'domainAmber' }, // nerd: verify → degrades to ◆
} satisfies Record<string, GlyphVariants>;

/** Tier-2 pack directory — used by pickers / docs to label & iterate packs. */
export const GLYPH_PACKS: Record<string, Record<string, GlyphVariants>> = {
  languages: LANGUAGES,
  databases: DATABASES,
  cloud: CLOUD,
  editors: EDITORS,
  os: OS,
  companies: COMPANIES,
  frameworks: FRAMEWORKS,
  files: FILES,
  social: SOCIAL,
  actions: ACTIONS,
  system: SYSTEM,
  packages: PACKAGES,
  devinfra: DEVINFRA,
};

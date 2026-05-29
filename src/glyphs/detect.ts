import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { IconSet } from './types.js';

export interface DetectOptions {
  /**
   * Path to a JSON file holding `{ "iconSet": "nerd" | "unicode" | "ascii" }`.
   * Defaults to `~/.config/blink/preferences.json`. This is the per-user
   * answer saved by a first-run probe (apps own the probe UI).
   */
  configPath?: string;
  /**
   * Absolute paths to "a Nerd Font is installed" marker files. If any exists,
   * detection resolves to `nerd`. Apps pass their own markers (e.g. a font
   * bundle's install receipt) — blink ships none, staying agnostic.
   */
  markerFiles?: string[];
  /** Override `process.env` (testing). */
  env?: NodeJS.ProcessEnv;
}

/**
 * Resolve which {@link IconSet} to render with, once, at app startup.
 *
 * The cascade (first match wins):
 *   1. hard env override — `BLINK_ICON_SET`, or `BLINK_NERD_FONT=1|0`, `BLINK_ASCII=1`
 *   2. saved per-user preference — `configPath`
 *   3. app-state marker — a font bundle's install receipt (`markerFiles`)
 *   4. terminal hints — `WT_SESSION`, `ITERM_PROFILE`, `TERM_PROGRAM`, …
 *   5. CI / dumb terminals → `ascii`
 *   6. safe default → `unicode`
 *
 * Never throws and never blocks: a blink app always gets a usable icon set.
 */
export async function detectIconSet(opts: DetectOptions = {}): Promise<IconSet> {
  const env = opts.env ?? process.env;

  // 1. Hard env overrides — no questions asked.
  const explicit = normalizeSet(env.BLINK_ICON_SET);
  if (explicit) return explicit;
  if (env.BLINK_NERD_FONT === '1') return 'nerd';
  if (env.BLINK_NERD_FONT === '0') return 'unicode';
  if (env.BLINK_ASCII === '1') return 'ascii';

  // 2. Saved per-user preference.
  const cfg = opts.configPath ?? join(homedir(), '.config', 'blink', 'preferences.json');
  const pref = readPreference(cfg);
  if (pref) return pref;

  // 3. App-state marker (e.g. a Nerd Font bundle was installed).
  if (opts.markerFiles?.some((p) => safeExists(p))) return 'nerd';

  // 4. Terminal hints — heuristic, never definitive.
  if (env.WT_SESSION) return 'nerd'; // Windows Terminal
  if (env.TERM_PROGRAM === 'WezTerm') return 'nerd';
  if (env.TERM_PROGRAM === 'ghostty') return 'nerd';
  if (/nerd|cask|powerline/i.test(env.ITERM_PROFILE ?? '')) return 'nerd';

  // 5. CI / dumb terminals.
  if (env.CI) return 'ascii';
  if (env.TERM === 'dumb' || !env.TERM) return 'ascii';

  // 6. Safe default — renders everywhere.
  return 'unicode';
}

function normalizeSet(value: string | undefined): IconSet | undefined {
  if (value === 'nerd' || value === 'unicode' || value === 'ascii') return value;
  return undefined;
}

function readPreference(path: string): IconSet | undefined {
  if (!safeExists(path)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { iconSet?: unknown };
    return normalizeSet(typeof parsed.iconSet === 'string' ? parsed.iconSet : undefined);
  } catch {
    return undefined;
  }
}

function safeExists(path: string): boolean {
  try {
    return existsSync(path);
  } catch {
    return false;
  }
}

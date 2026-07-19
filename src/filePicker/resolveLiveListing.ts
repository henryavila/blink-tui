/**
 * Live path-field → list target (FilePicker companion).
 *
 * When the operator Tabs into the free-path field and types, the listed folder
 * should track the draft as if they were navigating. This helper is the pure
 * (I/O-free) mapping:
 *
 * - exact existing directory → list it (`namePrefix` empty)
 * - partial last segment     → list parent + filter by `namePrefix`
 * - unresolvable             → fall back to `fallbackCwd`
 *
 * blink never imports `fs`/`os`/`path`. The app injects {@link PathProbes}
 * (Node `fs.statSync` + `path.*`, or a virtual tree in tests).
 */

/** App-fed path operations — keeps blink free of filesystem I/O. */
export interface PathProbes {
  /**
   * Resolve a typed draft against a base directory (absolute/`~`/relative).
   * Apps typically wrap `path.resolve` + home expansion.
   */
  resolve(draft: string, baseCwd: string): string;
  /** True when `abs` exists and is a directory. */
  isDirectory(abs: string): boolean;
  /** Optional: true when `abs` exists and is a regular file. */
  isFile?(abs: string): boolean;
  dirname(abs: string): string;
  basename(abs: string): string;
  /** True when the raw draft ends with a path separator (`/` or `\`). */
  endsWithSeparator?(draft: string): boolean;
}

export interface LiveListingTarget {
  /** Absolute (or app-resolved) directory whose entries should be listed. */
  cwd: string;
  /**
   * Partial basename to filter the list while typing the last segment.
   * Empty when `cwd` is the exact typed directory.
   */
  namePrefix: string;
}

const defaultEndsWithSep = (draft: string): boolean => /[/\\]$/.test(draft);

/**
 * Map a path-field draft to the directory that should be listed (and optional
 * filter prefix). Pure: all disk/home knowledge comes from `probes`.
 */
export function resolveLiveListing(
  draft: string,
  fallbackCwd: string,
  probes: PathProbes,
): LiveListingTarget {
  const raw = draft.trim();
  const fallback = probes.resolve(fallbackCwd || '.', fallbackCwd || '.');

  if (!raw) {
    return { cwd: fallback, namePrefix: '' };
  }

  const abs = probes.resolve(raw, fallback);
  const endsWithSep = (probes.endsWithSeparator ?? defaultEndsWithSep)(raw);

  if (probes.isDirectory(abs)) {
    return { cwd: abs, namePrefix: '' };
  }

  if (probes.isFile?.(abs)) {
    return {
      cwd: probes.dirname(abs),
      namePrefix: probes.basename(abs),
    };
  }

  // Does not exist (or not a dir/file).
  if (endsWithSep) {
    // Typed `foo/` but foo missing — stay on parent, no filter (create flow).
    const parent = probes.dirname(abs);
    if (probes.isDirectory(parent)) {
      return { cwd: parent, namePrefix: '' };
    }
    return { cwd: fallback, namePrefix: '' };
  }

  const parent = probes.dirname(abs);
  const prefix = probes.basename(abs);
  if (probes.isDirectory(parent)) {
    return { cwd: parent, namePrefix: prefix };
  }

  return { cwd: fallback, namePrefix: '' };
}

/**
 * Format the breadcrumb line apps pass as FilePicker `cwdLabel` while
 * path-typing. Pure string helper — no I/O.
 *
 * @example
 * formatLiveCwdLabel('/tmp', '')           // 'now  /tmp'
 * formatLiveCwdLabel('/tmp', 'cur')        // 'now  /tmp  ·  cur…'
 */
export function formatLiveCwdLabel(
  cwd: string,
  namePrefix: string,
  nowLabel = 'now',
): string {
  const base = `${nowLabel}  ${cwd}`;
  const p = namePrefix.trim();
  if (!p) return base;
  return `${base}  ·  ${p}…`;
}

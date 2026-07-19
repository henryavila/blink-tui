import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { cellWidth } from '../textWidth.js';
import { List, type ListRowData } from './List.js';
import { Input } from './CursorInput.js';

/**
 * Entry kind for a terminal file picker row. The app maps filesystem nodes
 * (and synthetic rows like `..`) onto this vocabulary — blink never reads disk.
 */
export type FileEntryKind = 'file' | 'dir' | 'parent' | 'other';

/** One row in {@link FilePicker}. Domain-agnostic: no path semantics in blink. */
export interface FileEntry {
  /** Stable id the app maps to a path or action (e.g. absolute path, `".."`). */
  id: string;
  /** Primary label (basename or `".."`). App may localise. */
  label: string;
  /** Intent for the kind mark column (file / dir / parent / other). */
  kind: FileEntryKind;
  /** Right-aligned aside (size, extension, mtime) — app formats. */
  meta?: string;
  /** De-emphasise (hidden, filtered-out soft, unavailable). */
  muted?: boolean;
}

export interface FilePickerProps {
  /**
   * Current location label (breadcrumb). App formats (`~/project`, absolute,
   * remote URI display). Empty / omit → no location line.
   */
  cwdLabel?: string;
  /** Rows in display order. App sorts and filters before pass-in. */
  entries: FileEntry[];
  /** Focused row id (app-fed). Confirm / open is external — focus never confirms. */
  focusedId?: string | null;
  /** Max list rows including overflow markers. Omit to render all. */
  height?: number;
  /** Context rows before the window scrolls. Default 0. */
  scrolloff?: number;
  /** Draw ▴/▾ N more markers. Default true. */
  overflowMarkers?: boolean;
  /**
   * Empty-state copy when `entries` is empty. Domain-neutral default;
   * app may pass localized text.
   */
  emptyMessage?: string;
  /**
   * Active filter string. Shown only when non-empty (typing-to-filter), unless
   * {@link showFilter} forces the chrome.
   */
  filter?: string;
  /** Placeholder when forcing filter chrome empty. */
  filterPlaceholder?: string;
  /**
   * Force the filter line even when `filter` is empty.
   * Default false — avoids a permanent “filter…” ghost under the list.
   */
  showFilter?: boolean;
  /**
   * Show the free-path field. Default false — path is a mode, not permanent chrome.
   * When true, renders under the list (app toggles via Tab).
   */
  showPath?: boolean;
  pathValue?: string;
  /** Caret index in the path field (0..pathValue.length). */
  pathCursor?: number;
  pathPlaceholder?: string;
  pathFocused?: boolean;
  pathError?: string;
  /** Soft busy — dims the body; app still owns keys. */
  busy?: boolean;
  /**
   * Outer width in cells. Constrains the list so the label/meta grid has a real
   * flex budget (prevents meta gluing to the label on full-bleed terminals).
   */
  width?: number;
}

/** Map entry kind → contract glyph name (no domain pack required). */
function kindGlyph(kind: FileEntryKind): string {
  switch (kind) {
    case 'parent':
      return 'back';
    case 'dir':
      return 'collapsed';
    case 'file':
      return 'circle';
    default:
      return 'circle';
  }
}

/** Truncate a label to fit remaining cells (middle ellipsis when long). */
function truncateLabel(label: string, maxCells: number): string {
  if (maxCells <= 1) return '…';
  if (cellWidth(label) <= maxCells) return label;
  if (maxCells <= 3) return '…';
  // Keep end (extension) when possible.
  const ell = '…';
  let out = '';
  // Greedy from end
  const chars = [...label];
  let w = 0;
  const kept: string[] = [];
  for (let i = chars.length - 1; i >= 0; i--) {
    const cw = cellWidth(chars[i] ?? '');
    if (w + cw + cellWidth(ell) > maxCells) break;
    kept.unshift(chars[i] ?? '');
    w += cw;
  }
  out = ell + kept.join('');
  return cellWidth(out) <= maxCells ? out : ell;
}

/**
 * Terminal **file / directory browser** chrome. Presentational only: the app
 * lists the filesystem, owns focus and keys, and decides open-dir vs confirm-file.
 * blink never calls `fs` and never knows product paths (track, EDL, …).
 *
 * ## Live path typing (Tab → path field)
 * When the free-path field is focused, apps should re-list as the draft changes
 * so typing feels like navigation. Use pure helper
 * {@link resolveLiveListing} with app-fed {@link PathProbes}:
 *
 * ```ts
 * const { cwd, namePrefix } = resolveLiveListing(pathDraft, baseCwd, probes);
 * const entries = listDir(cwd).filter(e => e.label.includes(namePrefix));
 * <FilePicker
 *   entries={entries}
 *   cwdLabel={formatLiveCwdLabel(shortCwd(cwd), namePrefix)}
 *   showPath pathFocused pathValue={pathDraft}
 * />
 * ```
 *
 * Complements {@link ChoicePicker} (flat multi-candidate) and
 * {@link GuidedPrompt} (one question). Prefer this when the human needs to
 * **navigate a tree**, not only pick from a pre-built list.
 *
 * INTENT, NOT STYLE: `kind` drives the mark glyph via the contract set; labels
 * and meta are opaque strings from the app.
 */
export function FilePicker({
  cwdLabel,
  entries,
  focusedId = null,
  height,
  scrolloff,
  overflowMarkers = true,
  emptyMessage = 'no entries',
  filter,
  filterPlaceholder = 'filter…',
  showFilter = false,
  showPath = false,
  pathValue,
  pathCursor,
  pathPlaceholder,
  pathFocused = false,
  pathError,
  busy = false,
  width,
}: FilePickerProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();
  const bodyColor = busy ? tokens.fgDisabled : tokens.fg;
  const wantFilter = showFilter || (filter != null && filter.length > 0);

  // Budget for label after caret + kind mark + gaps + meta (~8) + padding.
  const metaBudget = 8;
  const chromeBudget = 6; // caret + spaces + kind mark
  const labelMax =
    width != null
      ? Math.max(8, width - chromeBudget - metaBudget)
      : 48;

  const rows: ListRowData[] = entries.map((e) => {
    const mark = g(kindGlyph(e.kind));
    const label = truncateLabel(e.label, labelMax);
    return {
      id: e.id,
      label: `${mark} ${label}`,
      meta: e.meta,
      muted: e.muted || busy || e.kind === 'parent',
    };
  });

  const frame = (
    <Box flexDirection="column" width={width}>
      {cwdLabel ? (
        <Text color={busy ? tokens.fgDisabled : tokens.fgMuted} wrap="truncate">
          {cwdLabel}
        </Text>
      ) : null}

      {wantFilter ? (
        <Text color={tokens.fgFaint} wrap="truncate">
          {filter && filter.length > 0
            ? `filter · ${filter}`
            : filterPlaceholder}
        </Text>
      ) : null}

      {entries.length === 0 ? (
        <Box marginTop={cwdLabel || wantFilter ? 1 : 0}>
          <Text color={tokens.fgMuted} wrap="truncate">
            {emptyMessage}
          </Text>
        </Box>
      ) : (
        <Box
          marginTop={cwdLabel || wantFilter ? 1 : 0}
          width={width}
          flexDirection="column"
        >
          <List
            rows={rows}
            focusedId={focusedId}
            height={height}
            scrolloff={scrolloff}
            overflowMarkers={overflowMarkers}
          />
        </Box>
      )}

      {showPath ? (
        <Box marginTop={1} flexDirection="column" width={width}>
          <Text color={bodyColor} wrap="truncate">
            path
          </Text>
          <Input
            value={pathValue ?? ''}
            cursor={pathCursor}
            placeholder={pathPlaceholder ?? ''}
            focused={pathFocused}
            error={pathError}
          />
        </Box>
      ) : null}
    </Box>
  );

  return frame;
}

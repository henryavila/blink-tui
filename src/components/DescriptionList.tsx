import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { stateGlyph } from '../glyphs/glyphs.js';

/** One term/value row. Carries intent (`state`, `muted`) — never a raw glyph or colour. */
export interface DescriptionItem {
  /** The label in the gutter (`fgDim`). Omit for a full-width value line. */
  term?: string;
  /** The value text. */
  value: string;
  /**
   * A semantic status name → the framework draws its glyph + colour before the
   * value (`installed`, `missing`, `drift`, `pending`, …). See `stateGlyph()`.
   */
  state?: string;
  /** De-emphasise the value (e.g. a description line) → rendered in `fgMuted`. */
  muted?: boolean;
}

export interface DescriptionListProps {
  /** The rows. */
  items?: DescriptionItem[];
  /** Term-column width in cells. Default 10. */
  gutter?: number;
}

/**
 * A key/value block aligned to a character gutter — the generic shape behind any
 * detail pane or summary screen. The complement to {@link List}: List is a
 * vertical menu of peers, DescriptionList is the attributes of one thing.
 *
 * INTENT, NOT STYLE: a row may carry a semantic `state` (→ framework glyph +
 * colour) and a `muted` flag (→ de-emphasised value); it never takes a raw glyph
 * or a raw colour. Term-less rows render as a full-width value line.
 */
export function DescriptionList({
  items = [],
  gutter = 10,
}: DescriptionListProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();

  return (
    <Box flexDirection="column">
      {items.map((it, i) => {
        const st = it.state ? stateGlyph(it.state) : null;
        return (
          <Box key={i} flexDirection="row" gap={1}>
            {it.term != null ? (
              <Box width={gutter} flexShrink={0}>
                <Text color={tokens.fgDim} wrap="truncate">{it.term}</Text>
              </Box>
            ) : null}
            {st ? (
              <Box width={1} flexShrink={0}>
                <Text color={tokens[st.token]}>{g(st.glyph)}</Text>
              </Box>
            ) : null}
            <Text color={it.muted ? tokens.fgMuted : tokens.fg} wrap="truncate">
              {it.value}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

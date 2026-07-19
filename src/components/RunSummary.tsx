import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { Banner, type BannerTone } from './Banner.js';
import { DescriptionList, type DescriptionItem } from './DescriptionList.js';

export interface RunSummaryProps {
  /**
   * One-line outcome title ("step finished · 3 items"). Shown as a
   * {@link Banner} when `tone` is set, otherwise as plain text.
   */
  title: string;
  /**
   * Outcome intent → Banner glyph + colour. Omit for a neutral heading with no
   * leading mark. Same vocabulary as {@link Banner}: info / success / warn.
   */
  tone?: BannerTone;
  /**
   * Compact facts the human may need before the next phase (paths, counts,
   * duration, warning count). Not a log dump — app chooses which facts matter.
   */
  facts?: DescriptionItem[];
  /** Optional next-step line ("press enter to continue"). */
  next?: string;
  /** Term-column width for facts. Default 12. */
  gutter?: number;
}

/**
 * End-of-stage (or boundary) **outcome summary**: scannable in under two
 * seconds. Distinguishes "success with warnings" (`tone="warn"`) from hard
 * failure (apps escalate hard failure to {@link Dialog} or an error Banner +
 * stop — this primitive stays calm).
 *
 * Composition of {@link Banner} + {@link DescriptionList} + optional next-step
 * text, shipped as one primitive so handoff screens stay consistent across
 * apps without re-deriving layout.
 */
export function RunSummary({
  title,
  tone,
  facts = [],
  next,
  gutter = 12,
}: RunSummaryProps): React.ReactElement {
  const tokens = useTokens();

  return (
    <Box flexDirection="column">
      {tone ? (
        <Banner tone={tone} text={title} />
      ) : (
        <Text color={tokens.fg} wrap="truncate">
          {title}
        </Text>
      )}

      {facts.length > 0 ? (
        <Box marginTop={1}>
          <DescriptionList items={facts} gutter={gutter} />
        </Box>
      ) : null}

      {next ? (
        <Box marginTop={1}>
          <Text color={tokens.fgMuted} wrap="truncate">
            {next}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}

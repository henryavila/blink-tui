import React from 'react';
import { Box, Spacer, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { Pane } from './Pane.js';

/** One footer action: a key chip plus its label. */
export interface DialogAction {
  /** The hotkey shown in the chip, e.g. `'y'`. */
  key: string;
  /** What the key does, e.g. `'delete'`. */
  label: string;
  /** The default/confirming action — renders its chip in inverse-accent. */
  primary?: boolean;
}

/** Dialog emphasis, by purpose. `'default'` is a focused (lavender) modal. */
export type DialogTone = 'default' | 'error';

export interface DialogProps {
  /** Shown inside the top border. Keep ≤ 18 chars (it nests in the frame). */
  title: string;
  /**
   * Semantic emphasis: `'default'` is a focused (lavender) modal, `'error'`
   * recolours it red. The consumer never picks the shape — it is always the
   * rounded house pane.
   */
  tone?: DialogTone;
  /** Body rows, one `<Text>` line each — the convenience for plain-text bodies. */
  lines?: string[];
  /** Rich body (a `List`, glyph rows, a small form). Wins over `lines` when both given. */
  children?: React.ReactNode;
  /** Footer actions, laid out left-to-right with a 2-cell gap. */
  actions?: DialogAction[];
  /** Fixed dialog width in cells. */
  width?: number;
}

/**
 * A centred modal — the analogue of a "confirm" overlay in blink. There is no
 * backdrop, blur, or fade; Ink has no absolute positioning or z-index, so the
 * app renders `<Dialog/>` as a *full-screen replacement layer* instead of a
 * floating panel — it simply replaces focus.
 *
 * The frame is a fixed-width rounded {@link Pane}: lavender (focus tone) by
 * default, red for `tone="error"` — elevation is colour, never a heavier line.
 * The body is a blank line, the supplied `lines`, another blank line, then the
 * actions row. The primary action's key chip renders in inverse-accent video;
 * the rest sit muted.
 */
export function Dialog({
  title,
  tone = 'default',
  lines = [],
  children,
  actions = [],
  width = 44,
}: DialogProps): React.ReactElement {
  const tokens = useTokens();

  return (
    <Box flexGrow={1} justifyContent="center" alignItems="center">
      <Box width={width} flexShrink={0}>
        <Pane title={title} tone={tone === 'error' ? 'error' : 'focus'} flexGrow={0}>
          {/* Inner 1-cell gutter on top of the pane's own padding → a 2-cell
              content inset, matching the design kit's nested padding. */}
          <Box flexDirection="column" paddingX={1}>
            {/* blank line above the body */}
            <Text> </Text>
            {/* A rich `children` body wins; otherwise the plain-text `lines`. */}
            {children ??
              lines.map((line, i) => (
                <Text key={i} color={tokens.fg}>
                  {line}
                </Text>
              ))}
            {/* blank line below the body */}
            <Text> </Text>
            <Box flexDirection="row" gap={2}>
              {actions.map((action, i) => (
                <Box key={i} flexDirection="row" gap={1}>
                  {action.primary ? (
                    <Text color={tokens.fgInverse} backgroundColor={tokens.accent}>
                      {' ' + action.key + ' '}
                    </Text>
                  ) : (
                    <Text color={tokens.fgMuted}>{' ' + action.key + ' '}</Text>
                  )}
                  <Text color={tokens.fgMuted}>{action.label}</Text>
                </Box>
              ))}
              <Spacer />
            </Box>
            {/* blank line below the actions, mirroring the prototype's symmetric padding */}
            <Text> </Text>
          </Box>
        </Pane>
      </Box>
    </Box>
  );
}

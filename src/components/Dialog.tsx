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

export interface DialogProps {
  /** Shown inside the top border. Keep ≤ 18 chars (it nests in the frame). */
  title: string;
  /** `'error'` swaps the lavender double border for a red one. */
  variant?: 'default' | 'error';
  /** Body rows, one `<Text>` line each. */
  lines?: string[];
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
 * The frame is a fixed-width focused {@link Pane}: a lavender double border by
 * default, red for `variant="error"`. The body is a blank line, the supplied
 * `lines`, another blank line, then the actions row. The primary action's key
 * chip renders in inverse-accent video; the rest sit muted.
 */
export function Dialog({
  title,
  variant = 'default',
  lines = [],
  actions = [],
  width = 44,
}: DialogProps): React.ReactElement {
  const tokens = useTokens();
  const isError = variant === 'error';

  return (
    <Box flexGrow={1} justifyContent="center" alignItems="center">
      <Box width={width} flexShrink={0}>
        <Pane title={title} variant={isError ? 'error' : 'double'} focused flexGrow={0}>
          {/* blank line above the body */}
          <Text> </Text>
          {lines.map((line, i) => (
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
                  <Text color={tokens.bg} backgroundColor={tokens.accent}>
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
        </Pane>
      </Box>
    </Box>
  );
}

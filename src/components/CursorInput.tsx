import React from 'react';
import { Box, Text } from 'ink';
import { useTokens } from '../theme/context.js';
import { useGlyph } from '../glyphs/useGlyph.js';
import { blocks } from '../glyphs/glyphs.js';
import { useBlink } from '../hooks/useBlink.js';
import { Pane } from './Pane.js';

export interface CursorProps {
  /** Blink while true (default), hold solid while false. */
  active?: boolean;
  /** Block colour. Defaults to `tokens.fg`. */
  color?: string;
}

/**
 * The blink caret — a `▎` block that toggles at 1 Hz with step-end timing,
 * blink's one sanctioned text animation. The "off" frame is a single space, so
 * the caret occupies a stable cell and never nudges the line around it.
 */
export function Cursor({ active = true, color }: CursorProps): React.ReactElement {
  const tokens = useTokens();
  const on = useBlink(active);
  return <Text color={color ?? tokens.fg}>{on ? blocks.cursor : ' '}</Text>;
}

export interface InputProps {
  /** Title shown inside the top border. Keep ≤ 18 chars. */
  title?: string;
  /** Current field value. The app owns key handling; this is presentational. */
  value?: string;
  /** Hint shown in `fgDisabled` while the value is empty. */
  placeholder?: string;
  /** Focused fields round their border and trail a live cursor. */
  focused?: boolean;
  /** Error message — promotes the border to red and shows a line below. */
  error?: string;
}

/**
 * A single-line text field: a {@link Pane} wrapping one row of value (or
 * placeholder), with a {@link Cursor} trailing while focused. Value-driven and
 * presentational — the app feeds `value` and owns the keys.
 *
 * INTENT, NOT STYLE: the consumer never picks a border treatment; the field
 * derives its pane `tone` from its own state — `error` → red, `focused` →
 * lavender, otherwise resting. An error also prints a `✗ message` line below.
 */
export function Input({
  title,
  value = '',
  placeholder = '',
  focused = false,
  error,
}: InputProps): React.ReactElement {
  const tokens = useTokens();
  const g = useGlyph();

  const tone = error ? 'error' : focused ? 'focus' : 'resting';
  const empty = value.length === 0;

  return (
    <Box flexDirection="column">
      <Pane title={title} tone={tone} flexGrow={0}>
        <Box flexDirection="row">
          {empty ? (
            <Text color={tokens.fgDisabled}>{placeholder}</Text>
          ) : (
            <Text color={tokens.fg}>{value}</Text>
          )}
          {focused ? <Cursor active /> : null}
        </Box>
      </Pane>
      {error ? (
        <Box flexDirection="row" paddingLeft={1}>
          <Text color={tokens.stateErr}>{g('cross')}</Text>
          <Text color={tokens.fgMuted}>{' ' + error}</Text>
        </Box>
      ) : null}
    </Box>
  );
}

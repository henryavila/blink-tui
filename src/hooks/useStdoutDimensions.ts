import { useEffect, useState } from 'react';
import { useStdout } from 'ink';

export interface Dimensions {
  columns: number;
  rows: number;
}

/**
 * The live terminal size in character cells, updating on `SIGWINCH` (resize).
 *
 * blink's design target is 100×30; the mobile-mosh fallback is 60×20. Layouts
 * read this to switch between the full multi-pane view and a stacked one.
 * Falls back to 80×24 when the stream isn't a TTY (pipes, CI).
 */
export function useStdoutDimensions(): Dimensions {
  const { stdout } = useStdout();

  const read = (): Dimensions => ({
    columns: stdout?.columns ?? 80,
    rows: stdout?.rows ?? 24,
  });

  const [dimensions, setDimensions] = useState<Dimensions>(read);

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => setDimensions({ columns: stdout.columns, rows: stdout.rows });
    stdout.on('resize', onResize);
    // Sync once on mount in case the size changed before the listener attached.
    onResize();
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  return dimensions;
}

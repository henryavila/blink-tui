import { useIconSet } from '../theme/context.js';
import { glyph } from './glyphs.js';

/**
 * Returns a resolver bound to the icon set in context, so components don't have
 * to thread `iconSet` everywhere:
 *
 * ```tsx
 * const g = useGlyph();
 * <Text color={tokens.stateOk}>{g('check')}</Text>
 * ```
 */
export function useGlyph(): (name: string) => string {
  const set = useIconSet();
  return (name: string) => glyph(name, set);
}

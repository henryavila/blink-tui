/**
 * blink — a framework for building modern, elegant TUI apps.
 *
 * Ink (React for the terminal) primitives on a strict character-cell visual
 * contract: Catppuccin theming, dual-mode Nerd Font glyphs, keyboard-only
 * interaction, box-drawing borders. See README.md for the full contract.
 */

// ─── Theme ───────────────────────────────────────────────────────────────────
export { catppuccinMocha } from './theme/palette.js';
export type { Palette, PaletteColor } from './theme/palette.js';
export { mochaTokens } from './theme/tokens.js';
export type { SemanticTokens } from './theme/tokens.js';
export { mocha, defaultTheme } from './theme/theme.js';
export type { Theme } from './theme/theme.js';
export {
  ThemeProvider,
  useBlink as useBlinkContext,
  useTheme,
  useTokens,
  useIconSet,
} from './theme/context.js';
export type { ThemeProviderProps, BlinkContextValue } from './theme/context.js';

// ─── Glyphs ────────────────────────────────────────────────────────────────────
export {
  stateGlyphs,
  navGlyphs,
  domainGlyphs,
  glyph,
  registerGlyphs,
  hasGlyph,
  boxStyles,
  boxChars,
  spinnerFrames,
  spinnerFor,
  blocks,
} from './glyphs/glyphs.js';
export type { BuiltinGlyphName, BoxChars, BoxStyleName } from './glyphs/glyphs.js';
export { useGlyph } from './glyphs/useGlyph.js';
export { detectIconSet } from './glyphs/detect.js';
export type { DetectOptions } from './glyphs/detect.js';
export type { IconSet, GlyphVariants } from './glyphs/types.js';

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export { useStdoutDimensions } from './hooks/useStdoutDimensions.js';
export type { Dimensions } from './hooks/useStdoutDimensions.js';
export { useBlink } from './hooks/useBlink.js';
export { useSpinnerFrame } from './hooks/useSpinnerFrame.js';
export type { SpinnerOptions } from './hooks/useSpinnerFrame.js';

// ─── Components ──────────────────────────────────────────────────────────────────
export { Pane } from './components/Pane.js';
export type { PaneProps, PaneVariant } from './components/Pane.js';
export { List, ListRow } from './components/List.js';
export type { ListProps, ListRowProps, ListRowData } from './components/List.js';
export { Footer } from './components/Footer.js';
export type { FooterProps, HotkeyDef } from './components/Footer.js';
export { Input, Cursor } from './components/CursorInput.js';
export type { InputProps, CursorProps } from './components/CursorInput.js';
export { Dialog } from './components/Dialog.js';
export type { DialogProps, DialogAction } from './components/Dialog.js';
export { Spinner } from './components/Spinner.js';
export type { SpinnerProps } from './components/Spinner.js';

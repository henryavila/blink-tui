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
  COMMON_DOMAINS,
  glyph,
  glyphColor,
  registerGlyphs,
  hasGlyph,
  stateGlyph,
  stateIntents,
  selectionIntents,
  boxStyles,
  boxChars,
  spinnerFrames,
  spinnerFor,
  blocks,
  blocksH,
} from './glyphs/glyphs.js';
export type {
  BuiltinGlyphName,
  CommonDomainName,
  StateName,
  StateIntent,
  SelectionName,
  BoxChars,
  BoxStyleName,
} from './glyphs/glyphs.js';
export { useGlyph } from './glyphs/useGlyph.js';
export { detectIconSet } from './glyphs/detect.js';
export type { DetectOptions } from './glyphs/detect.js';
export type { IconSet, GlyphVariants } from './glyphs/types.js';

// ─── Utilities ─────────────────────────────────────────────────────────────────
export { cellWidth } from './textWidth.js';

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export { useStdoutDimensions } from './hooks/useStdoutDimensions.js';
export type { Dimensions } from './hooks/useStdoutDimensions.js';
export { useBlink } from './hooks/useBlink.js';
export { useSpinnerFrame } from './hooks/useSpinnerFrame.js';
export type { SpinnerOptions } from './hooks/useSpinnerFrame.js';
export { useListWindow, computeWindow } from './hooks/useListWindow.js';
export type { UseListWindowOptions, ListWindow } from './hooks/useListWindow.js';
export { useListNavigation } from './hooks/useListNavigation.js';
export type { UseListNavigationOptions, ListNavigation } from './hooks/useListNavigation.js';
export { useListSelection } from './hooks/useListSelection.js';
export type {
  UseListSelectionOptions,
  ListSelection,
  SelectionMode,
} from './hooks/useListSelection.js';

// ─── Components ──────────────────────────────────────────────────────────────────
export { Pane } from './components/Pane.js';
export type { PaneProps, PaneTone, PaneVariant } from './components/Pane.js';
export { List, ListRow } from './components/List.js';
export type { ListProps, ListRowProps, ListRowData } from './components/List.js';
export { Header } from './components/Header.js';
export type { HeaderProps } from './components/Header.js';
export { DescriptionList } from './components/DescriptionList.js';
export type { DescriptionListProps, DescriptionItem } from './components/DescriptionList.js';
export { LogView } from './components/LogView.js';
export type { LogViewProps } from './components/LogView.js';
export { Footer } from './components/Footer.js';
export type { FooterProps, HotkeyDef } from './components/Footer.js';
export { Input, Cursor } from './components/CursorInput.js';
export type { InputProps, CursorProps } from './components/CursorInput.js';
export { Dialog } from './components/Dialog.js';
export type { DialogProps, DialogTone, DialogAction } from './components/Dialog.js';
export { Banner } from './components/Banner.js';
export type { BannerProps, BannerTone } from './components/Banner.js';
export { Spinner } from './components/Spinner.js';
export type { SpinnerProps } from './components/Spinner.js';
export { ProgressBar } from './components/ProgressBar.js';
export type { ProgressBarProps } from './components/ProgressBar.js';

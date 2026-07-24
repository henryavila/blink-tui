/**
 * blink — a framework for building modern, elegant TUI apps.
 *
 * Ink (React for the terminal) primitives on a strict character-cell visual
 * contract: Catppuccin theming, dual-mode Nerd Font glyphs, keyboard-only
 * interaction, box-drawing borders. See README.md for the full contract.
 */

// ─── Theme ───────────────────────────────────────────────────────────────────
export {
  catppuccinMocha,
  palettes,
  neutral,
  nord,
  gruvbox,
  tokyonight,
  latte,
  PALETTE_SLOTS,
} from './theme/palette.js';
export type { Palette, PaletteColor } from './theme/palette.js';
export { mochaTokens, buildTokens } from './theme/tokens.js';
export type { SemanticTokens } from './theme/tokens.js';
export {
  mocha,
  defaultTheme,
  getTheme,
  hasTheme,
  allThemes,
  listThemes,
  registerTheme,
} from './theme/theme.js';
export type { Theme, ThemeMeta, ThemeMode, ThemeDefinition } from './theme/theme.js';
export {
  ThemeProvider,
  useBlink as useBlinkContext,
  useTheme,
  useTokens,
  useIconSet,
  useThemeControls,
} from './theme/context.js';
export type {
  ThemeProviderProps,
  BlinkContextValue,
  ThemeControls,
} from './theme/context.js';

// ─── Glyphs ────────────────────────────────────────────────────────────────────
export {
  stateGlyphs,
  navGlyphs,
  glyph,
  glyphColor,
  registerGlyphs,
  registerGlyph,
  hasGlyph,
  registeredNames,
  deriveAscii,
  stateGlyph,
  stateIntents,
  selectionIntents,
  boxStyles,
  boxChars,
  spinnerFrames,
  spinnerFor,
  blocks,
  blocksH,
  DEFAULT_GLYPH_COLOR,
  DEFAULT_UNICODE,
  // Tier 1 + Tier 2 packs (content — opt in with registerGlyphs)
  COMMON_DOMAINS,
  LANGUAGES,
  DATABASES,
  CLOUD,
  EDITORS,
  OS,
  COMPANIES,
  FRAMEWORKS,
  FILES,
  SOCIAL,
  ACTIONS,
  SYSTEM,
  PACKAGES,
  DEVINFRA,
  GLYPH_PACKS,
  // Tier 3 raw index (escape hatch)
  nf,
  nfHas,
  nfChar,
  registerNerdIndex,
  NERD_INDEX,
  NERD_INDEX_SOURCES,
} from './glyphs/glyphs.js';
export type {
  BuiltinGlyphName,
  CommonDomainName,
  StateName,
  StateIntent,
  SelectionName,
  BoxChars,
  BoxStyleName,
  GlyphInput,
} from './glyphs/glyphs.js';
export { useGlyph } from './glyphs/useGlyph.js';
export { detectIconSet } from './glyphs/detect.js';
export type { DetectOptions } from './glyphs/detect.js';
export type { IconSet, GlyphVariants, GlyphColor } from './glyphs/types.js';

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
export {
  Footer,
  packFooterRows,
  packFooterColumns,
  chipWidth,
  keyChipWidth,
  descChipWidth,
  columnStartOffset,
  columnSlotWidth,
  rowUsedAligned,
} from './components/Footer.js';
export type { FooterProps, HotkeyDef, ColumnPack } from './components/Footer.js';
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
export { ProgressList } from './components/ProgressList.js';
export type { ProgressListProps, ProgressItem, ProgressState } from './components/ProgressList.js';
export { Form, useFormNavigation, resolveChoices, buildStops, validateForm } from './components/Form.js';
export type {
  FormProps,
  FieldSpec,
  FieldKind,
  PathStatus,
  FieldValue,
  FormValues,
  FormValidation,
  FormNavigation,
  FocusStop,
  ChoiceInput,
  ResolvedChoice,
} from './components/Form.js';

// ─── Operator pack (guided multi-phase CLIs) ───────────────────────────────────
export { LinkPanel, truncateHref } from './components/LinkPanel.js';
export type { LinkPanelProps, LinkStatus, LinkDetail } from './components/LinkPanel.js';
export { WaitGate } from './components/WaitGate.js';
export type { WaitGateProps, WaitGateStatus } from './components/WaitGate.js';
export { StageRail, pickStageRailMode } from './components/StageRail.js';
export type { StageRailProps, StageItem } from './components/StageRail.js';
export { GuidedPrompt, useGuidedPromptNavigation } from './components/GuidedPrompt.js';
export type {
  GuidedPromptProps,
  GuidedChoice,
  UseGuidedPromptNavigationOptions,
  GuidedPromptNavigation,
} from './components/GuidedPrompt.js';
export { ChoicePicker } from './components/ChoicePicker.js';
export type { ChoicePickerProps, ChoiceItem } from './components/ChoicePicker.js';
export { FilePicker } from './components/FilePicker.js';
export type {
  FilePickerProps,
  FileEntry,
  FileEntryKind,
} from './components/FilePicker.js';
/** Live path-field → list target (inject probes; blink never reads disk). */
export {
  resolveLiveListing,
  formatLiveCwdLabel,
} from './filePicker/resolveLiveListing.js';
export type {
  PathProbes,
  LiveListingTarget,
} from './filePicker/resolveLiveListing.js';
export { RunSummary } from './components/RunSummary.js';
export type { RunSummaryProps } from './components/RunSummary.js';
export { MetricStrip, fitMetrics } from './components/MetricStrip.js';
export type { MetricStripProps, MetricItem } from './components/MetricStrip.js';
export { KeyHints } from './components/KeyHints.js';
export type { KeyHintsProps } from './components/KeyHints.js';

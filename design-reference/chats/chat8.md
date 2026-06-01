# Footer spacing fix

_Started 2026-05-29 17:58 UTC_

---

## User

Nocódigo abaixo, está a corrao que eu alciui no blink-TUI. uma maremt top no footer, pois ele etava semrpe colando no conteudo de cima. ajsute o ds par refletir o mesmo

⏺ Update(src/components/Footer.tsx)
Added 5 lines
  keys?: HotkeyDef[];
  /** Optional status node, flush-right in faint text (e.g. `'6 of 8'`). */
  right?: React.ReactNode;
  /**
   * Cells of breathing room above the bar. House default is `1` so the footer
   * never butts up against the content above it; pass `0` to pin it flush.
   */
  marginTop?: number;
}

/**

⏺ Update(src/components/Footer.tsx)
Added 1 line, removed 1 line
 * inverse hotkey chips are filled. The padding cells stay unfilled, matching
 * how a terminal status bar reads.
 */
export function Footer({ keys = [], right }: FooterProps): React.ReactElement {
export function Footer({ keys = [], right, marginTop = 1 }: FooterProps): React.ReactElement {
  const tokens = useTokens();
  const { columns } = useStdoutDimensions();


⏺ Update(src/components/Footer.tsx)
Added 1 line, removed 1 line
  }

  return (
    <Box flexDirection="row" paddingX={1} justifyContent="space-between">
    <Box flexDirection="row" paddingX={1} justifyContent="space-between" marginTop={marginTop} flexShrink={0}>
      <Box flexDirection="row" gap={3} flexShrink={1} overflow="hidden">
        {shown.map((h, i) => (
          <Hotkey key={i} k={h.k} desc={h.desc} />

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: str_replace_edit]_

Got it — your fix gives the footer a default 1-cell of breathing room above it (`marginTop = 1`), with `0` to pin flush. Let me mirror that in the design system: the `Footer.jsx` component, the footer preview, and the docs.Now the footer preview — show the 1-cell margin as the house default and document it:

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: done]_

Let me verify the footer preview renders cleanly.Done. I mirrored your `marginTop` fix across the design system:

- **`Footer.jsx`** — added `marginTop = 1` prop (1 cell ≈ `var(--cell-h)`), defaulting to a cell of breathing room above the bar; `marginTop={0}` pins it flush. Updated the header doc comment to match yours.
- **`preview/15-component-footer.html`** — the footer specimen now shows the 1-cell margin above as the house default, with a `.flush` variant documented.
- **`README.md`** — noted the default and the flush override on the Footer line.


# Input Framework Components

_Started 2026-05-29 18:19 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "Blink TUI"
Project currently has 11 file(s)
Current date is now May 29, 2026
</system-info>

<default aesthetic_system_instructions>
The user has not attached a design system. If they have ALSO not attached references or art direction, and the project is empty, you must ASK the user what visual aesthetic they want. Use the questions_v2 tool to ask about preferred vibe, audience, colors, type, mood, etc. Do NOT just pick your own visual aesthetic without getting the user's aesthetic input -- this is how you get slop!

Once answered, use this guidance when creating designs:
- Choose a type pairing from web-safe set or Google Fonts. Helvetica is a good choice. Avoid hard-to-read or overly stylized fonts. Use 1-3 fonts only.
- Foreground and background: choose a color tone (warm, cool, neutral, something in-between). Use subtly-toned whites and blacks; avoid saturations above 0.02 for whites.
- Accents: choose 0-2 additional accent colors using oklch. All accents should share same chroma and lightness; vary hue.
- NEVER write out an SVG yourself that's more complicated than a square, circle, diamond, etc.
- For imagery, never hand-draw SVGs; use subtly-striped SVG placeholders instead with monospace explainers for what should be dropped there (e.g. “product shot”)

CRITICAL: ignore default aesthetic entirely if given other aesthetic instructions like reference images, design systems or guidance, or if there are files in the project already.
</default aesthetic_system_instructions>

<pasted_text name="Pasted text (138 lines)">
# blink — spec de novos primitivos

Derivado da tela **mesh setup wizard**. Dois primitivos que o blink ainda não
expõe (hoje resolvidos no app por composição, mas que pertencem ao DS), mais os
glyphs de domínio a curar. Segue o princípio do blink: **o consumidor declara
intent; o blink possui glyph + cor + borda + foco**. Nenhum prop de cor/glyph cru.

---

## 1 · `Form` + `useFormNavigation` — campos configuráveis (nível parâmetros)

### Problema genérico (não "o wizard precisa")
Renderizar um conjunto vertical de **campos rotulados**, cada um um controle de
um *kind* conhecido (texto, segredo, toggle, escolha única, escolha múltipla),
navegável só por teclado, com validação por restrições declaradas. É o padrão
"tela de opções/config" — universal em TUIs (git config, tokens, versões,
flags). Hoje, sem ele, **todo app re-deriva checkbox/radio/toggle a partir dos
glyphs `SELECTION`** — exatamente a divergência que o blink existe para evitar.

### O que o blink passa a possuir
- `☑ / ☐ / ▣` (via `SELECTION`) e suas cores; o cursor `▎` (via `Cursor`);
- o preenchimento de foco (`--bg-focused`) no controle focado;
- o marcador de obrigatório (`*` em `--state-warn`);
- a linha de erro (`✗` em `--state-err` + texto `--fg-muted`);
- os três tiers de texto (label `--fg`, valor selecionado `--fg`, não-selecionado `--fg-muted`).

### API — só intent
```jsx
<Form
  fields={[
    { name:'name',     kind:'text',        label:'Git author name', required:true },
    { name:'token',    kind:'secret',      label:'ngrok auth token' },           // mascara automático
    { name:'editor',   kind:'select',      label:'Default editor',
      choices:[{id:'nvim',label:'nvim'},{id:'code',label:'code'},{id:'vim',label:'vim'}] },
    { name:'versions', kind:'multiselect', label:'PHP versions', min:1,
      choices:[{id:'8.2'},{id:'8.3'},{id:'8.4'},{id:'8.5'}] },
    { name:'default',  kind:'select',      label:'Default version', optionsFrom:'versions' }, // choices derivam de outro campo
    { name:'composer', kind:'toggle',      label:'Install Composer globally' },
  ]}
  values={values}      // { [name]: string | boolean | string[] }
  focusId={nav.focusId}
  errors={errors}      // { [name]: string }  → blink desenha a linha de erro
/>
```
- `kind` é a ÚNICA expressão de aparência permitida; o blink decide o glyph/cor.
- `optionsFrom` resolve as choices de um `select`/`multiselect` a partir do valor
  de outro campo (ex.: "Default version" deriva das versões marcadas).
- `min`/`max` em `multiselect` → o blink impede passar do limite (reusa
  `useListSelection`).

### Headless (o app é dono das teclas; chama as intents)
```js
const nav = useFormNavigation({ fields, values });
// nav.focusId
// nav.next() / nav.prev()        ← move entre controles (linear: choice→choice→próximo campo)
// nav.toggle()                   ← ␣ no controle focado (choice/toggle)
// nav.setText(name, str)         ← edição de text/secret
// nav.commit() → { ok, errors }  ← valida por required/min e retorna erros
```
Nenhum componente do `Form` lê tecla — igual ao resto do blink.

### Por que pertence ao blink (e não fica no app)
O glyph + cor + foco de um campo PRECISAM ser possuídos centralmente para todo
app de config sair on-style de graça. `text`/`secret` já reusam o `Input`
existente — o `Form` é a camada que faltava acima dele.

---

## 2 · `ProgressList` + `ProgressBar` — execução de tarefas (job runner)

### Problema genérico
Renderizar uma lista de **passos/tarefas** que transitam por estados
(pending → running → ok/failed), com **spinner ao vivo na linha em execução** e
uma barra de progresso agregada. Universal: qualquer apply/migrate/sync/build.
O blink já tem `Spinner` e a rampa de blocos, mas falta a LISTA que liga
`state` por linha a (glyph ou spinner) + a barra, seguindo a linha ativa.

### O que o blink passa a possuir
- mapa `state → glyph`: `◯ pending` · **Spinner** `running` (a única animação
  sancionada) · `✓ ok` · `✗ failed` · `◐ waiting` · cores semânticas;
- o preenchimento da linha ativa, e o *windowing* (`▴/▾ N`) como no `List`;
- a barra determinada a partir da rampa de eighth-blocks.

### API — só intent
```jsx
<ProgressBar value={okCount / total} width={52} />   // 0..1 → blink desenha █░ em --accent

<ProgressList
  items={queue.map(b => ({ id:b.id, label:b.id, domain:b.icon, state: statusOf(b), meta:'installing…' }))}
  activeId={current.id}
  height={20}        // windowed, segue a linha ativa
/>
```
`state` (intent) = `pending | running | ok | failed | skipped | waiting`.
- **`waiting`** (`◐` em `--state-warn`) é importante: um passo bloqueado em ação
  manual (ex.: pareamento do Syncthing, que espera `↵`) precisa ler diferente de
  um `running`. O `ProgressList` deve tolerar uma linha ficar `running`/`waiting`
  indefinidamente. (O prompt de pausa em si é um `Dialog` do app — não é primitivo.)

### Por que pertence ao blink
O spinner-por-linha é a única animação do contrato; deixá-lo no app convida cada
um a reinventar o ciclo de braille e as cores de estado. `ProgressBar` já está
listado nos componentes do blink — este spec só confirma o shape
`{ value:0..1, width }` e adiciona a lista que o consome.

---

## 3 · glyph requests — promover a entradas curadas

Hoje registrados no app via forma `nf` (resolvem do índice-semente). Como são
domínios dev-infra recorrentes, merecem entrada **curada** num pack
(`{ nerd, unicode, ascii, color }`). Proposta (curador deve verificar os
codepoints `nerd`):

| nome | nerd (verificar) | unicode | ascii | color (família) |
|---|---|---|---|---|
| `laravel` | `dev-laravel` (já em `FRAMEWORKS`) | `◆` | `[lv]` | `--domain-red` |
| `tailscale` | md/custom — verificar | `◆` | `[ts]` | `--domain-cyan` |
| `syncthing` | custom — verificar | `↻` | `[st]` | `--domain-violet` |
| `mosh` | `fa-bolt`/custom | `◆` | `[mo]` | `--domain-amber` |
| `valet` | `dev-laravel` (alias) | `◆` | `[va]` | `--domain-red` |
| `mailpit` | `fa-envelope` | `✉` | `[mp]` | `--domain-amber` |
| `ngrok` | `fa-bolt` | `⚡` | `[ng]` | `--domain-amber` |
| `code-server` | `dev-visualstudio` (já em `EDITORS` como `vscode`) | `◆` | `[cs]` | `--domain-blue` |

Recomendação: `laravel` e `code-server`/`vscode` já existem em packs Tier 2 —
basta promover/aliasar. `tailscale`, `syncthing`, `mosh` são novos: curar com os
fallbacks `{unicode, ascii}` acima para não dar tofu em terminal sem Nerd Font.
Pela *prime directive*, ícones de TÓPICO genéricos (`user`, `code`, `globe`,
`terminal`, `folder`, `cog`…) ficam no app — não promover.

---

### Resumo do que NÃO vira primitivo (fica no app)
- O **router de telas** e o estado da seleção/opções (lógica de domínio).
- O **prompt de pausa do Syncthing** (`Dialog` + texto do app).
- A composição 3-pane master-detail (já é só `Pane` + `List`).

</pasted_text>


<system-reminder>Auto-injected reminder (ignore if not relevant): do not recreate copyrighted or branded UI unless the user's email domain matches that company. Create original designs instead.</system-reminder>

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

This is a rich existing TUI design system. Let me explore the foundations before doing anything.

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Comprehensive system. Let me read the CSS tokens, the most relevant UI kit components, and the preview format conventions.

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Let me understand the preview card format, the existing Input/Dialog/Spinner components, and how cards are registered.

_[tool: grep]_

_[tool: read_file]_

_[tool: list_files]_

Let me check how cards are tagged for the DS tab, the Pane component, and the manifest.

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Let me look at the reference app demo and its README to understand composition patterns and the "wizard" context.

_[tool: read_file]_

Let me check the glyph-packs structure since the spec references existing packs and proposes new entries.

_[tool: questions_v2]_

I now have a thorough understanding of blink — the visual contract, the intent-not-style API principle, the component architecture (`Pane`/`List`/`Input`/`Dialog` as JSX with headless logic + `Object.assign(window,…)`), the four-tier glyph engine, the preview-card format, and the reference `svcd` demo.

Your spec is wonderfully prescriptive — it basically *is* the design. What's open is mostly **deliverable scope** and a few judgment calls that the spec itself flags as tensions (e.g. the prime-directive vs. "promote to a pack" question for the domain glyphs). Let me ask before building.

## User

Questions answered:
- glyph_home: Decide for me
- scope: dont create a screen. we are a framework. deliver compontes self conainted.
- waiting_pause: Yes — demo a step stuck in 'waiting' plus the app-level pause Dialog
- variations: Decide for me
- theme: tokyonight — matches the current index.html demo
- secret_mask: Bullet mask ••••• with a reveal hint
- errors_demo: Yes — show a required-missing error and a min-not-met multiselect error
- card_count: 4

## Assistant

_[tool: update_todos]_

I have a complete picture of the system now. Let me set up a plan and snip the exploration once I start building.

_[tool: write_file]_

Now I'll write the components. Starting with `Form.jsx`.Now `ProgressList.jsx`:

_[tool: write_file]_

_[tool: str_replace_edit]_

Now the DEVINFRA glyph pack:

## Assistant

_[tool: write_file]_

Now the preview cards. Card 25 — Form (mounts the real component in curated states):

_[tool: write_file]_

Card 26 — ProgressBar:

_[tool: write_file]_

Card 27 — ProgressList with all states plus the app-composed pause Dialog:

_[tool: str_replace_edit]_

_[tool: write_file]_

Card 28 — the DEVINFRA glyph pack:

_[tool: show_html]_

Let me check the cards render cleanly, starting with the Form card.I'll proceed to verify before handing off since these are new components with interdependencies.

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: save_screenshot]_

Card 25 renders beautifully — all five field kinds, the required-error red border, focus fill on the `8.3` choice, both validation errors, and `optionsFrom` showing `—`. Let me check Form B below the fold.

_[tool: view_image]_

_[tool: show_html]_

Form B is perfect — focused secret with cursor + reveal hint, resting filled text. Let me check the remaining three cards.

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: show_html]_

ProgressBar card is clean — eighth-block partial visible on the `1/8 cell` row. Now card 27:

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: show_html]_

Card 27 is excellent — all six states render with the DEVINFRA domain glyphs, the active line is filled with a live spinner, `◐ waiting` and `◌ skipped` read distinctly, and the composed pause Dialog sits below. Now card 28:

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: register_assets]_

All four cards render cleanly. Let me register them as DS assets (matching the existing cards) and update the docs.

_[tool: str_replace_edit]_

Now let me update the docs. First the root README:

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Now the UI-kit README:

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: update_todos]_

All cards render and docs are updated. Let me finalize the todo list and clean up exploration context.

_[tool: snip]_

Now I'll surface the Form card and verify it lands cleanly.

_[tool: done]_

_[tool: fork_verifier_agent]_

Built the two new primitives and the glyph curation as self-contained framework pieces — no app screen.

**Components** (`ui_kits/tui_app/`)
- **`Form.jsx`** — `Form` + headless `useFormNavigation`. Intent-only: `kind` (text/secret/toggle/select/multiselect) picks the control; blink owns the SELECTION glyphs, focus fill, required `*`, and error line. Reuses `Input` for text/secret (cursor, masking, border). Includes `optionsFrom` (choices derived from another field) and `min`/`max` enforcement.
- **`ProgressList.jsx`** — `ProgressBar` (0..1 → `█░` in accent, eighth-block precision on the boundary cell) + `ProgressList` (per-line state→glyph, live braille spinner on the running line, `◐ waiting` and `◌ skipped`, active-line fill, windowing).

**Glyphs** — added a curated Tier-2 `DEVINFRA` pack (opt-in, so the prime directive holds): `laravel` promoted, `valet`/`code-server` aliased, and `tailscale`/`syncthing`/`mosh`/`ngrok`/`mailpit` with safe unicode+ascii fallbacks. Nerd codepoints for the three new ones are marked `verify`.

**DS cards** — `25` Form, `26` ProgressBar, `27` ProgressList (with the app-composed pause Dialog shown as composition, not a primitive), `28` the devinfra pack — all in tokyonight, registered for review. READMEs updated.

Two judgment calls worth flagging:
- `useFormNavigation` takes an `onChange(nextValues)` (the spec omitted it but value edits need a sink) — documented in the file.
- `skipped` uses `◌` (not a Tier-0 contract glyph); easy to swap if you'd rather keep it within the contract.


# Estrutura Monorepo Design System

_Started 2026-05-29 11:19 UTC_

---

## User

Estou no Design System. faz entido eu criar compontnes do blink-tui aqui, ou em um novo proejto do claodue desing (protopito): blink-tui não é um app, é um frmawork para criar apps

## Assistant

_[tool: list_files]_

Boa pergunta — e a distinção que você fez é exatamente a chave da resposta.

**Como `blink-tui` é um framework (não um app), os componentes pertencem aqui, no Design System.** Aqui está o raciocínio:

## Por que aqui (Design System)

- **Um framework É um design system.** O blink-tui não tem "telas" — ele tem *primitivas* (pane, list, footer, input, dialog, spinner) que outras pessoas vão compor em apps. Isso é a definição de um design system: vocabulário reutilizável, não um fluxo específico.
- **Você já tem a fundação aqui.** Olhando o projeto, já existe `colors_and_type.css`, os glyphs (`glyphs.json`), a fonte Caskaydia Mono Nerd, os tokens de cor/superfície, e os previews de componentes (`13-component-pane`, `14-component-list`, etc.). Os componentes do blink-tui são a continuação natural desse trabalho — não um projeto novo.
- **Cada componente vira um "card" revisável** no painel do Design System, com versões e status. É assim que um framework deve ser documentado.

## Quando criar um projeto novo (Claude Design / protótipo)

Crie um projeto separado **só quando for mostrar um app de exemplo** — um fluxo concreto, clicável, que *usa* o blink-tui para provar que o framework funciona. Aí sim faz sentido um protótipo, porque:
- tem navegação real entre estados/telas;
- demonstra composição, não as primitivas isoladas;
- pode virar um "showcase" ou demo de marketing.

## Resumo

| | Onde | O quê |
|---|---|---|
| **Primitivas / componentes do framework** | 👉 **Aqui (Design System)** | pane, list, input, dialog, spinner, footer, borders, tokens |
| **App de exemplo / demo** | Projeto novo (protótipo) | um fluxo real que consome o framework |

Quer que eu continue construindo os componentes do blink-tui aqui? Se sim, me diga **quais primitivas** ainda faltam (ou se quer que eu audite os previews atuais e proponha a lista completa de componentes que um TUI framework precisa).


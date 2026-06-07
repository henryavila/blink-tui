#!/usr/bin/env bash
#
# Primeira publicação MANUAL de @henryavila/blink-tui no npm.
#
# Use SOMENTE nesta primeira vez. Depois que o pacote existir no npm, configure
# o OIDC Trusted Publishing (ver docs/PUBLISHING.md) e todas as releases futuras
# publicam sozinhas via .github/workflows/publish.yml — sem token.
#
# Uso:
#   NPM_TOKEN=npm_xxxxxxxx ./scripts/publish-first.sh
#
# O token é gravado num .npmrc temporário e apagado ao final — nada persiste.
# Gere um token "Automation" (ou "Granular" com escopo de publish) em:
#   https://www.npmjs.com/settings/<seu-usuario>/tokens
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo "✖ NPM_TOKEN não definido." >&2
  echo "  Rode:  NPM_TOKEN=npm_xxxxxxxx ./scripts/publish-first.sh" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "✖ Working tree sujo. Faça commit/stash antes de publicar." >&2
  git status --short >&2
  exit 1
fi

echo "▸ Instalando dependências (npm ci)…"
npm ci

echo "▸ Build…"
npm run build

echo "▸ Testes…"
npm test

echo "▸ Conteúdo que será publicado:"
npm pack --dry-run

# .npmrc temporário só com o token; removido em qualquer saída.
NPMRC="$(mktemp)"
trap 'rm -f "$NPMRC"' EXIT
printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$NPMRC"

echo
echo "▸ Publicando @henryavila/blink-tui …"
# Sem --provenance: provenance exige OIDC de CI e falha em publicação local.
# A geração de provenance acontece no workflow OIDC (publish.yml).
npm publish --userconfig "$NPMRC" --access public

echo
echo "✔ Publicado com sucesso."
echo "  Próximo passo: configurar OIDC Trusted Publishing — ver docs/PUBLISHING.md"

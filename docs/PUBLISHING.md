# Publicando `@henryavila/blink-tui`

Dois estágios: a **primeira publicação** é manual (com token), e dali em diante
tudo é automático via **OIDC Trusted Publishing** — sem token guardado em lugar
nenhum.

---

## Estágio 1 — Primeira publicação (manual, com token)

O OIDC só pode ser configurado num pacote que **já existe** no npm. Por isso a
primeira versão sobe pela sua máquina.

### 1. Gere um token npm

https://www.npmjs.com/settings/henryavila/tokens → **Generate New Token**

- Tipo **Automation** (ou **Granular Access Token** com permissão de _publish_
  no escopo `@henryavila`).
- Copie o valor (`npm_...`). Ele não será exibido de novo.

### 2. Rode o script

```bash
NPM_TOKEN=npm_xxxxxxxxxxxxxxxx ./scripts/publish-first.sh
```

O script:

1. Confere que a árvore do git está limpa.
2. `npm ci` → `npm run build` → `npm test`.
3. Mostra o conteúdo do tarball (`npm pack --dry-run`).
4. Publica com `npm publish --access public`.

O token vai para um `.npmrc` temporário e é apagado ao final — **nada persiste**
no disco nem no git.

> Sem `--provenance` aqui: provenance exige OIDC de CI e falha em publicação
> local. A attestation passa a ser gerada automaticamente no Estágio 2.

---

## Estágio 2 — Configurar OIDC Trusted Publishing (uma vez)

Depois que `@henryavila/blink-tui` existir no registro:

### 1. No npmjs.com

Página do pacote → **Settings** → seção **Trusted Publisher** →
**GitHub Actions** → preencha:

| Campo               | Valor                          |
| ------------------- | ------------------------------ |
| Organization / user | `henryavila`                   |
| Repository          | `blink-tui`                    |
| Workflow filename   | `publish.yml`                  |
| Environment         | _(deixe em branco)_            |

Salve.

### 2. Pronto

O workflow `.github/workflows/publish.yml` já está no repo. Ele dispara em
**release publicada** e usa `id-token: write` + `--provenance`. Nenhum
`NPM_TOKEN` precisa existir nos Secrets do GitHub.

Pode (e deve) **revogar o token do Estágio 1** depois disso — não é mais usado.

---

## Releases futuras (fluxo normal)

```bash
# 1. bumpa a versão e cria a tag
npm version patch          # ou minor / major

# 2. envia commit + tag
git push --follow-tags

# 3. cria a release no GitHub (dispara o publish.yml)
gh release create "v$(node -p "require('./package.json').version")" --generate-notes
```

Ao publicar a release, o Actions builda, testa e publica no npm com provenance —
automático.

---

## Checklist rápido

- [ ] `npm whoami` autenticado / token gerado (só Estágio 1)
- [ ] árvore do git limpa
- [ ] `version` em `package.json` ainda não publicada
- [ ] `npm pack --dry-run` mostra só `dist/`, `README.md`, `LICENSE`, `package.json`
- [ ] (Estágio 2) Trusted Publisher configurado no npmjs.com

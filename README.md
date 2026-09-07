# Ciclopédia

Catálogo bilíngue (PT/EN) dos **ciclos** de *Magic: The Gathering* — grupos de cartas
irmãs do mesmo set, ligadas por tema e mecânica, tipicamente uma por cor (WUBRG). Os Titãs
de *Magic 2011*, os Commands de *Lorwyn*, as duais originais de *Alpha*.

**No ar:** [ciclopedia-mtg.vercel.app](https://ciclopedia-mtg.vercel.app)

São **951 ciclos** catalogados, todos de exatamente 5 cartas — **4.755 cartas** no total.
Não há login, favoritos, deck builder nem preços.

## Rodando

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # prerenderiza ~959 páginas
npm start
```

**Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.** Zero dependências de
runtime além de `next`, `react` e `react-dom`.

## Como está montado

```text
src/app/          4 rotas: / · /ciclos · /ciclos/[cycle] · /sobre
src/components/   15 componentes; 8 deles "use client"
src/lib/          cycles (servidor) · cyclesIndex (cliente) · filters · featured
scripts/          a pipeline de dados + os JSON gerados + 2 scripts de auditoria
```

**Os dados são congelados no build.** Um script Node busca tudo uma vez (Scryfall Tagger
para a lista de ciclos, Scryfall para as cartas) e grava
`scripts/cycles.generated.json` (~3,2 MB). **O visitante nunca chama a Scryfall** — só
baixa imagem do CDN. Não há `fetch()` em `src/`.

Esse JSON **não pode chegar ao navegador**. Quem filtra o catálogo é o cliente, sobre um
**índice enxuto** (~100 KB) montado no build por `buildCycleIndex()`; o estado dos filtros
vive na URL, então todo filtro é compartilhável.

### Três coisas que já quebraram este projeto

1. **Nenhuma feature pode multiplicar a contagem de rotas.** São 951 páginas
   prerenderizadas; um segmento dinâmico novo acima de `[cycle]` significa 1902.
2. **`export const dynamicParams = false` em `src/app/ciclos/[cycle]/page.tsx` não é
   otimização** — é o que faz o 404 responder 404. Sem ela, slug inválido vira 200.
3. **Nada que rode no cliente pode importar `@cycles`**, nem transitivamente.

Cada uma está explicada por extenso em `AGENTS.md` e `PROJETO.md`.

## Documentação

> ⚠️ **Os documentos abaixo não estão neste repositório, e isso é decisão, não descuido**
> (2026-09-07). O `.gitignore:47` tem um `*.md` que engole todo markdown menos este
> `README.md`. Eles servem ao desenvolvimento na máquina de quem toca o projeto; não há
> segundo dev para quem precisem viajar, e a Vercel não lê markdown.
>
> **A consequência tem dente:** `git worktree add` só materializa arquivo versionado, então
> **um worktree novo não tem `AGENTS.md` nem `CLAUDE.md`** — as regras acima somem, em
> silêncio. Por isso **agente deste projeto trabalha no diretório principal, nunca em
> worktree.** Isto está escrito no `AGENTS.md`, que é justamente o arquivo que o worktree
> não teria.

| Arquivo | O que tem |
| --- | --- |
| `AGENTS.md` | as regras estruturais (carregado automaticamente via `CLAUDE.md`) |
| `PROJETO.md` | o mapa: stack, rotas, fronteira servidor/cliente, dados, i18n, decisões |
| `PENDENCIAS.md` | **o estado real** — o que falta, por que importa, o que custa |
| `HANDOFF.md` | o log datado de cada sessão, com as medições |
| `DIAGNOSTICO-VISUAL.md` | a auditoria visual e de acessibilidade |
| `plano-data.md` | como os dados foram obtidos, com números reais |
| `design_handoff_ciclopedia/` | a spec visual: tokens, telas, estados |

## Créditos

Dados e imagens de cartas: [Scryfall](https://scryfall.com) e
[Scryfall Tagger](https://tagger.scryfall.com). Projeto não-comercial, sem afiliação com a
Wizards of the Coast.

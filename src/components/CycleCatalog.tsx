"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CardFan } from "./CardFan";
import { CycleIndexTable } from "./CycleIndexTable";
import { FilterSidebar } from "./FilterSidebar";
import { T } from "./T";
import {
  applyQuery,
  decodeIndex,
  type CycleIndex,
  type IndexedCycle,
} from "@/lib/cyclesIndex";
import {
  buildHref,
  countSelected,
  DENSITIES,
  EMPTY_QUERY,
  isDefaultQuery,
  parseQuery,
  perPage,
  RARITY_LABELS,
  STRUCTURE_LABELS,
  toggleValue,
  type DensityKey,
  type FilterGroup,
  type Query,
  type SortKey,
} from "@/lib/filters";

const PATH = "/ciclos";

// Dono da query e da lista. Recebe o índice enxuto como prop — nunca importa
// `@cycles`, direta ou transitivamente, senão os 3,1 MB do JSON entram no
// bundle do navegador.
//
// `children` é a vitrine renderizada no servidor: os primeiros 24 ciclos com o
// <CyclePreview> inteiro, leque de miniaturas e tudo. Ela é o HTML estático de
// /ciclos e continua sendo o que aparece enquanto a query for a padrão. Assim
// que existe busca, filtro, ordenação ou página, quem responde é a lista de
// resultados aqui embaixo — que só tem o que cabe no índice, sem carta.
export function CycleCatalog({
  index,
  sets,
  years,
  children,
}: {
  index: CycleIndex;
  sets: { code: string; name: string }[];
  years: number[];
  children: ReactNode;
}) {
  const entries = useMemo(() => decodeIndex(index), [index]);
  const [query, setQuery] = useState<Query>(EMPTY_QUERY);

  // A URL é a fonte da verdade, e ela só existe no cliente: a página é
  // estática, o mesmo HTML responde a qualquer query string.
  //
  // ⚠️ Ler com useSearchParams custaria uma boundary de Suspense obrigatória
  // (doc da 16.2.10, use-search-params#prerendering) e jogaria a tela inteira
  // para fora do HTML estático — o prerender só guardaria o fallback. Ler de
  // window num efeito mantém o HTML completo e sem JS ainda sobra o catálogo.
  // O preço é um quadro com a vitrine antes de a query da URL entrar.
  useEffect(() => {
    function sync() {
      // URL limpa devolve o próprio EMPTY_QUERY, e não uma cópia igual: com a
      // mesma referência o React descarta a re-renderização, e o caso comum
      // (entrar em /ciclos sem query) não paga nada por hidratar.
      const search = window.location.search;
      setQuery(search ? parseQuery(new URLSearchParams(search)) : EMPTY_QUERY);
    }
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  // replaceState e não router.replace: não há nada para buscar no servidor —
  // a rota é estática e a query string não muda o payload. Sem entrada nova de
  // histórico o "voltar" continua saindo de /ciclos, como já saía.
  const update = useCallback((next: Query) => {
    setQuery(next);
    window.history.replaceState(null, "", buildHref(PATH, next));
  }, []);

  // Qualquer mudança de critério volta para a página 1 — página 7 de um filtro
  // que agora tem 3 resultados é tela vazia sem explicação.
  const toggle = useCallback(
    (group: FilterGroup, value: string) =>
      update({
        ...query,
        selected: {
          ...query.selected,
          [group]: toggleValue(query.selected[group], value),
        },
        page: 1,
      }),
    [query, update],
  );

  const results = useMemo(() => applyQuery(entries, query), [entries, query]);
  // Quantos cabem por página é função da densidade, não uma constante: o
  // card carrega 5 miniaturas e a linha do índice não carrega nenhuma.
  const per = perPage(query.density);
  const pageCount = Math.max(1, Math.ceil(results.length / per));
  const page = Math.min(query.page, pageCount);
  const visible = results.slice((page - 1) * per, page * per);
  const showcase = isDefaultQuery(query);
  const filtered = countSelected(query.selected) > 0 || query.q !== "";

  function goToPage(next: number) {
    update({ ...query, page: next });
    window.scrollTo({ top: 0 });
  }

  // O href da paginação sai do mesmo buildHref que escreve a URL, então o
  // destino da âncora e o que o replaceState grava não podem divergir.
  const hrefForPage = (next: number) => buildHref(PATH, { ...query, page: next });

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <FilterSidebar
        sets={sets}
        years={years}
        selected={query.selected}
        sort={query.sort}
        onToggle={toggle}
        onSort={(sort: SortKey) => update({ ...query, sort, page: 1 })}
        onClear={() => update(EMPTY_QUERY)}
      />

      {/* min-w-0 porque filho de flex não encolhe abaixo do conteúdo por
          padrão e a grade de resultados empurrava a barra lateral; max-w
          impede a lista de esticar indefinidamente em monitor largo. */}
      <div className="min-w-0 flex-1 max-w-[var(--content-max)] px-8 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Campo de busca precisa de rótulo, e rótulo em atributo não é
              traduzível por CSS. O <label> embrulha o input e o nome sai do
              texto visível, onde o ramo do idioma inativo está display:none e
              portanto fora do nome acessível. Sem placeholder, sem aria-label.

              O rótulo é visível, e não sr-only: ícone de lupa sozinho não é
              rótulo (WCAG 3.3.2), e "por nome ou set" é a instrução que diz
              que a busca alcança o nome da coleção, não só o do ciclo. */}
          <label className="flex w-full flex-col gap-2 sm:max-w-80">
            <span className="text-meta font-semibold tracking-[0.14em] text-muted uppercase">
              <T pt="Buscar por nome ou set" en="Search by name or set" />
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-border-input bg-input px-3 py-2 focus-within:border-gold focus-within:focus-ring">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-3.5 shrink-0 fill-none stroke-current text-muted"
              >
                <circle cx="6.75" cy="6.75" r="4.5" strokeWidth="1.5" />
                <path d="M10.25 10.25 14 14" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query.q}
                onChange={(event) =>
                  update({ ...query, q: event.target.value, page: 1 })
                }
                className="w-full bg-transparent text-ui text-foreground outline-none"
              />
            </span>
          </label>

          {/* A filtragem é síncrona — não há o que carregar, então não há
              spinner honesto a mostrar. O estado que falta é o de *aviso*: a
              lista inteira troca sem que nada seja anunciado. role="status"
              faz a contagem ser lida a cada mudança de filtro ou de busca, e
              aria-atomic mantém "N ciclos com esses filtros" numa frase só. */}
          <div className="flex flex-wrap items-center gap-4">
            <div role="status" aria-atomic="true" className="flex items-baseline gap-4">
            <p className="text-ui text-muted">
              {results.length === 0 ? (
                <T pt="nenhum ciclo" en="no cycles" />
              ) : (
                <T
                  pt={`${results.length} ciclo${results.length > 1 ? "s" : ""}`}
                  en={`${results.length} cycle${results.length > 1 ? "s" : ""}`}
                />
              )}
              {filtered && <T pt=" com esses filtros" en=" with these filters" />}
            </p>
              {pageCount > 1 && (
                <p className="text-ui text-muted">
                  <T
                    pt={`página ${page} de ${pageCount}`}
                    en={`page ${page} of ${pageCount}`}
                  />
                </p>
              )}
            </div>

            <DensityToggle
              value={query.density}
              onChange={(density) => update({ ...query, density, page: 1 })}
            />
          </div>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="text-title text-gold-weak">◆</span>
            <p className="font-serif text-title">
              <T pt="Nenhum ciclo encontrado" en="No cycles found" />
            </p>
            <p className="max-w-80 text-ui text-muted">
              <T
                pt="Nenhum ciclo do catálogo combina com todos esses filtros ao mesmo tempo."
                en="No cycle in the catalog matches all of these filters at once."
              />
            </p>
            <button
              type="button"
              onClick={() => update(EMPTY_QUERY)}
              className="mt-1 text-ui text-gold underline-offset-2 hover:underline active:text-foreground"
            >
              <T pt="limpar filtros" en="clear filters" />
            </button>
          </div>
        ) : showcase ? (
          children
        ) : query.density === "index" ? (
          <CycleIndexTable entries={visible} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((entry) => (
              <ResultCard key={entry.slug} entry={entry} />
            ))}
          </div>
        )}

        {pageCount > 1 && results.length > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            hrefForPage={hrefForPage}
            onGoToPage={goToPage}
          />
        )}
      </div>
    </div>
  );
}

// Cartão de resultado: o mesmo leque de miniaturas da vitrine, montado a partir
// dos ids do índice. O custo desses ids está medido no cabeçalho de
// cyclesIndex.ts; o que ele compra é não existirem duas telas para a mesma
// coisa — antes só a primeira página sem filtro tinha imagem.
//
// As miniaturas entram decorativas (alt="") e não com o nome da carta como no
// <CyclePreview>: o índice não carrega nome de carta, e mandá-lo custaria mais
// que os ids. O nome do ciclo, logo abaixo, já dá o nome acessível do link.
function ResultCard({ entry }: { entry: IndexedCycle }) {
  const rarity = entry.rarity ? RARITY_LABELS[entry.rarity] : undefined;
  const structure = entry.structure ? STRUCTURE_LABELS[entry.structure] : undefined;

  return (
    <Link
      href={`/ciclos/${entry.slug}`}
      className="group flex flex-col gap-1 rounded-xl border border-border-card bg-panel px-4 py-3 hover:border-gold"
    >
      <CardFan images={entry.thumbs.map((src) => ({ src, alt: "" }))} />

      <span className="font-serif text-body leading-tight font-bold">
        <T pt={entry.pt} en={entry.en} />
      </span>

      {/* Mesma linha do <CyclePreview>, reescrita aqui porque cycleSetLine()
          mora em cycles.ts, que importa o JSON de 3,1 MB. */}
      <span className="text-ui text-muted">
        {entry.setName === null ? (
          <T pt="Vários sets" en="Multiple sets" />
        ) : entry.year ? (
          `${entry.setName} . ${entry.year}`
        ) : (
          entry.setName
        )}
      </span>

      {(rarity || structure) && (
        <span className="mt-1 flex flex-wrap items-center gap-x-2 text-meta font-medium tracking-[0.12em] text-muted-weak uppercase">
          {rarity && <T {...rarity} />}
          {rarity && structure && <span aria-hidden="true">·</span>}
          {structure && <T {...structure} />}
        </span>
      )}
    </Link>
  );
}

// Botões com aria-pressed, e não radios: isto escolhe como a lista é
// desenhada, não preenche um campo de formulário. O ativo é preenchimento
// sólido e não só cor — matiz sozinha não pode carregar informação
// (WCAG 1.4.1), e é o mesmo motivo do sublinhado no toggle de idioma.
function DensityToggle({
  value,
  onChange,
}: {
  value: DensityKey;
  onChange: (density: DensityKey) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-border-input p-1">
      {DENSITIES.map((density) => (
        <button
          key={density.value}
          type="button"
          aria-pressed={value === density.value}
          onClick={() => onChange(density.value)}
          className={`cursor-pointer rounded-md px-3 py-2 text-ui ${
            value === density.value
              ? "bg-primary font-semibold text-primary-foreground"
              : "text-muted hover:text-gold"
          }`}
        >
          <T {...density.label} />
        </button>
      ))}
    </div>
  );
}

type PageNav = {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  onGoToPage: (page: number) => void;
};

// <nav> só recebe nome por aria-label, e atributo não é alcançado pelo CSS que
// troca o idioma. O padrão do projeto para isso é o da trilha em
// ciclos/[cycle]/page.tsx: um <nav> por idioma, marcado com data-t, com o
// rótulo já no idioma dele. O ramo inativo fica em display:none, que sai da
// árvore de acessibilidade inteira — aria-label junto. aria-labelledby seria o
// erro oposto: ali o display:none conta e o nome sairia em PT e EN colados.
function Pagination(props: PageNav) {
  return (
    <>
      <PaginationNav lang="pt" label="Paginação" {...props} />
      <PaginationNav lang="en" label="Pagination" {...props} />
    </>
  );
}

function PaginationNav({
  lang,
  label,
  page,
  pageCount,
  hrefForPage,
  onGoToPage,
}: PageNav & { lang: "pt" | "en"; label: string }) {
  return (
    <nav
      aria-label={label}
      data-t={lang}
      className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-ui"
    >
      <PageLink href={hrefForPage(1)} onGo={() => onGoToPage(1)} disabled={page === 1}>
        <T pt="⇤ primeira" en="⇤ first" />
      </PageLink>
      <PageLink
        href={hrefForPage(page - 1)}
        onGo={() => onGoToPage(page - 1)}
        disabled={page === 1}
      >
        <T pt="← anterior" en="← previous" />
      </PageLink>

      <span className="flex items-center gap-2">
        {pageWindow(page, pageCount).map((n, i) =>
          n === 0 ? (
            <span key={"elipse-" + i} aria-hidden="true" className="text-muted-weak">
              …
            </span>
          ) : (
            <PageLink
              key={n}
              href={hrefForPage(n)}
              onGo={() => onGoToPage(n)}
              disabled={false}
              current={n === page}
            >
              {n}
            </PageLink>
          ),
        )}
      </span>

      <PageLink
        href={hrefForPage(page + 1)}
        onGo={() => onGoToPage(page + 1)}
        disabled={page === pageCount}
      >
        <T pt="próxima →" en="next →" />
      </PageLink>
      <PageLink
        href={hrefForPage(pageCount)}
        onGo={() => onGoToPage(pageCount)}
        disabled={page === pageCount}
      >
        <T pt="última ⇥" en="last ⇥" />
      </PageLink>

      <PageJump pageCount={pageCount} onGoToPage={onGoToPage} />
    </nav>
  );
}

// Janela de vizinhas: a atual com duas de cada lado, mais a primeira e a última
// sempre presentes. 0 é marcador de reticências, não página — a regra de quando
// elidir mora aqui, e não espalhada pelo JSX.
function pageWindow(page: number, pageCount: number): number[] {
  const around = 2;
  const start = Math.max(1, page - around);
  const end = Math.min(pageCount, page + around);
  const out: number[] = [];

  if (start > 1) {
    out.push(1);
    if (start > 2) out.push(0);
  }
  for (let n = start; n <= end; n += 1) out.push(n);
  if (end < pageCount) {
    if (end < pageCount - 1) out.push(0);
    out.push(pageCount);
  }
  return out;
}

// O campo fecha o que a janela não alcança: com 40 páginas na galeria,
// primeira/última e duas vizinhas ainda deixam o meio a vários cliques. A
// navegação é em memória — digitar 30 e dar enter não custa rede nenhuma.
//
// O <label> embrulha o input e o nome acessível sai do texto visível, como no
// campo de busca: aria-label não é alcançado pelo CSS que troca o idioma.
function PageJump({
  pageCount,
  onGoToPage,
}: {
  pageCount: number;
  onGoToPage: (page: number) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const wanted = Math.floor(Number(value));
        if (Number.isFinite(wanted) && wanted >= 1 && wanted <= pageCount) {
          onGoToPage(wanted);
        }
        setValue("");
      }}
    >
      <label className="flex items-center gap-2 text-muted">
        <T pt="ir para" en="go to" />
        <input
          type="number"
          min={1}
          max={pageCount}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-16 rounded-lg border border-border-input bg-input px-2 py-2 text-ui text-foreground tabular-nums"
        />
      </label>
      <button
        type="submit"
        className="cursor-pointer text-gold underline-offset-2 hover:underline active:text-foreground"
      >
        <T pt="ir" en="go" />
      </button>
    </form>
  );
}

// Âncora de verdade, não <button>: é ela que existe no HTML estático, que o
// crawler segue e que funciona com o JS ainda não carregado. Com JS, o
// onNavigate cancela a navegação e a página troca em memória — a rota é a
// mesma e o payload estático não depende da query string, então navegar de
// verdade só custaria um round-trip para receber o mesmo HTML de volta.
//
// onNavigate e não onClick (doc da 16.2.10, components/link#onnavigate): ele
// "only runs during client-side navigation" e não dispara em Ctrl/Cmd+clique,
// então abrir em aba nova continua sendo abrir em aba nova. prefetch={false}
// pelo mesmo motivo do preventDefault: o payload do destino já está aqui.
function PageLink({
  href,
  onGo,
  disabled,
  current,
  children,
}: {
  href: string;
  onGo: () => void;
  disabled: boolean;
  current?: boolean;
  children: ReactNode;
}) {
  // <button disabled> e não <span>: o <span> não era controle nenhum na árvore
  // de acessibilidade, então "não existe página anterior" não era dito — o
  // item simplesmente sumia do foco, sem aviso. O botão desabilitado continua
  // sendo anunciado como botão, com o estado junto.
  if (disabled) {
    return (
      <button type="button" disabled className="text-muted-weak/50">
        {children}
      </button>
    );
  }

  // A página atual é preenchimento sólido, não só cor: aria-current diz ao
  // leitor de tela e o preenchimento diz a quem enxerga, sem depender de matiz
  // (WCAG 1.4.1). Ela continua sendo link, e clicar nela é um no-op.
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={current ? "page" : undefined}
      onNavigate={(event) => {
        event.preventDefault();
        onGo();
      }}
      // active: escurece em vez de clarear — o pressionado nunca pode ter
      // menos contraste que o repouso, e --foreground é o token mais escuro.
      className={
        current
          ? "rounded-md bg-primary px-2 py-1 font-semibold text-primary-foreground tabular-nums"
          : "text-gold tabular-nums underline-offset-2 hover:underline active:text-foreground"
      }
    >
      {children}
    </Link>
  );
}

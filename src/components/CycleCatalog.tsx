"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
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
  EMPTY_QUERY,
  isDefaultQuery,
  parseQuery,
  PER_PAGE,
  RARITY_LABELS,
  STRUCTURE_LABELS,
  toggleValue,
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
  const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const page = Math.min(query.page, pageCount);
  const visible = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
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

      <div className="flex-1 px-8 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Campo de busca precisa de rótulo, e rótulo em atributo não é
              traduzível por CSS. O <label> embrulha o input e o nome sai do
              <span sr-only>, onde o ramo do idioma inativo está display:none
              e portanto fora do nome acessível. Sem placeholder, sem
              aria-label. */}
          <label className="flex w-full items-center gap-2 rounded-lg border border-border-input bg-input px-3 py-2 focus-within:border-gold sm:max-w-80">
            <span className="sr-only">
              <T pt="Buscar ciclo por nome ou set" en="Search cycles by name or set" />
            </span>
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
              className="w-full bg-transparent text-[13.5px] text-foreground outline-none"
            />
          </label>

          <div className="flex items-baseline gap-4">
            <p className="text-[13px] text-muted">
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
              <p className="text-[13px] text-muted">
                <T
                  pt={`página ${page} de ${pageCount}`}
                  en={`page ${page} of ${pageCount}`}
                />
              </p>
            )}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="text-2xl text-gold-weak">◆</span>
            <p className="font-serif text-[22px]">
              <T pt="Nenhum ciclo encontrado" en="No cycles found" />
            </p>
            <p className="max-w-80 text-[13.5px] text-muted">
              <T
                pt="Nenhum ciclo do catálogo combina com todos esses filtros ao mesmo tempo."
                en="No cycle in the catalog matches all of these filters at once."
              />
            </p>
            <button
              type="button"
              onClick={() => update(EMPTY_QUERY)}
              className="mt-1 text-[13px] text-gold underline-offset-2 hover:underline"
            >
              <T pt="limpar filtros" en="clear filters" />
            </button>
          </div>
        ) : showcase ? (
          children
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

// Cartão de resultado: só o que o índice carrega. Sem leque de miniaturas —
// alimentar as 5 imagens de 951 ciclos no cliente custaria de 82 a 152 KB
// brotli a mais no HTML, contra os 14 KB do índice inteiro. A medição está no
// cabeçalho de cyclesIndex.ts.
function ResultCard({ entry }: { entry: IndexedCycle }) {
  const rarity = entry.rarity ? RARITY_LABELS[entry.rarity] : undefined;
  const structure = entry.structure ? STRUCTURE_LABELS[entry.structure] : undefined;

  return (
    <Link
      href={`/ciclos/${entry.slug}`}
      className="b-border-card flex flex-col gap-1 rounded-xl border bg-panel px-4 py-3 hover:border-gold"
    >
      <span className="font-serif text-[17px] leading-tight font-bold">
        <T pt={entry.pt} en={entry.en} />
      </span>

      {/* Mesma linha do <CyclePreview>, reescrita aqui porque cycleSetLine()
          mora em cycles.ts, que importa o JSON de 3,1 MB. */}
      <span className="text-[12.5px] text-muted">
        {entry.setName === null ? (
          <T pt="Vários sets" en="Multiple sets" />
        ) : entry.year ? (
          `${entry.setName} . ${entry.year}`
        ) : (
          entry.setName
        )}
      </span>

      {(rarity || structure) && (
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10.5px] font-medium tracking-[0.12em] text-muted-weak uppercase">
          {rarity && <T {...rarity} />}
          {rarity && structure && <span aria-hidden="true">·</span>}
          {structure && <T {...structure} />}
        </span>
      )}
    </Link>
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
      className="mt-10 flex items-center justify-center gap-6 text-[13px]"
    >
      <PageLink
        href={hrefForPage(page - 1)}
        onGo={() => onGoToPage(page - 1)}
        disabled={page === 1}
      >
        <T pt="← anterior" en="← previous" />
      </PageLink>
      <span className="text-muted-weak">
        {page} / {pageCount}
      </span>
      <PageLink
        href={hrefForPage(page + 1)}
        onGo={() => onGoToPage(page + 1)}
        disabled={page === pageCount}
      >
        <T pt="próxima →" en="next →" />
      </PageLink>
    </nav>
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
  children,
}: {
  href: string;
  onGo: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return <span className="text-muted-weak/50">{children}</span>;
  }
  return (
    <Link
      href={href}
      prefetch={false}
      onNavigate={(event) => {
        event.preventDefault();
        onGo();
      }}
      className="text-gold underline-offset-2 hover:underline"
    >
      {children}
    </Link>
  );
}

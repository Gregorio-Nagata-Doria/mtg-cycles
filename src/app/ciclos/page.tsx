import Link from "next/link";
import { CyclePreview } from "@/components/CyclePreview";
import { FilterSidebar } from "@/components/FilterSidebar";
import { filterCycles, listSets, parseSelected } from "@/lib/cycles";
import { buildHref, countSelected } from "@/lib/filters";

const PATH = "/ciclos";
const PER_PAGE = 24;

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const selected = parseSelected(params);

  const results = filterCycles(selected);
  const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);
  const visible = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-1 flex-row">
      <FilterSidebar sets={listSets()} selected={selected} />

      <div className="flex-1 px-8 py-6">
        <div className="mb-5 flex items-baseline justify-between">
          <p className="text-[13px] text-muted">
            {results.length === 0
              ? "nenhum ciclo"
              : `${results.length} ciclo${results.length > 1 ? "s" : ""}`}
            {countSelected(selected) > 0 && " com esses filtros"}
          </p>
          {pageCount > 1 && (
            <p className="text-[13px] text-muted">
              página {page} de {pageCount}
            </p>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="text-2xl text-gold-weak">◆</span>
            <p className="font-serif text-[22px]">Nenhum ciclo encontrado</p>
            <p className="max-w-80 text-[13.5px] text-muted">
              Nenhum ciclo do catálogo combina com todos esses filtros ao mesmo
              tempo.
            </p>
            <Link
              href={PATH}
              className="mt-1 text-[13px] text-gold underline-offset-2 hover:underline"
            >
              limpar filtros
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-8">
            {visible.map((cycle) => (
              <CyclePreview key={cycle.slug} singleCycle={cycle} />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-6 text-[13px]">
            <PageLink
              href={buildHref(PATH, selected, page - 1)}
              disabled={page === 1}
            >
              ← anterior
            </PageLink>
            <span className="text-muted-weak">
              {page} / {pageCount}
            </span>
            <PageLink
              href={buildHref(PATH, selected, page + 1)}
              disabled={page === pageCount}
            >
              próxima →
            </PageLink>
          </nav>
        )}
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="text-muted-weak/50">{children}</span>;
  }
  return (
    <Link href={href} className="text-gold hover:underline underline-offset-2">
      {children}
    </Link>
  );
}


import Image from "next/image";
import Link from "next/link";
import { Ornament } from "@/components/Ornament";
import { T } from "@/components/T";

import { ParamValue } from "next/dist/server/request/params";
import { notFound } from "next/navigation";
import cycles from "@cycles";
import { cycleArt, cycleRarity } from "@/lib/cycles";
import { RARITY_LABELS } from "@/lib/filters";

import SetSymbol from "@/components/setSymbol";

import type { Metadata } from "next";

// A lista de slugs é completa e vem do JSON gerado, então nada precisa ser
// renderizado sob demanda. Sem isso, a boundary de ciclos/loading.tsx começa
// o streaming antes do notFound() e o 404 vira 200.
export const dynamicParams = false;

const CRUMB = "text-[13px] text-muted";
const CRUMB_LINK = "underline-offset-2 hover:text-gold hover:underline";

export function generateStaticParams() {
  return cycles.map((x) => ({ cycle: x.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cycle: string }>;
}): Promise<Metadata> {
  const { cycle } = await params;
  const found = cycles.find((x) => x.slug === cycle);

  if (!found) return { title: "Página não encontrada" };

  const name = found.name.pt;
  const set = found.setName
    ? `${found.setName}${found.year ? ` (${found.year})` : ""}`
    : null;

  const title = set ? `${name} — ${set}` : name;
  const description = set
    ? `As cinco cartas do ciclo ${name}, do set ${set}.`
    : `As cinco cartas do ciclo ${name}.`;
  const art = cycleArt(found);

  return {
    title,
    description,
    alternates: { canonical: `/ciclos/${found.slug}` },
    // O merge de metadata do App Router é raso: este openGraph substitui o do
    // layout inteiro, não só o que está declarado aqui. Por isso siteName,
    // locale e type aparecem repetidos — omitir qualquer um some com a tag.
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Ciclopédia",
      title,
      description,
      url: `/ciclos/${found.slug}`,
      ...(art && {
        images: [{ url: art.url, width: 626, height: 457, alt: art.name }],
      }),
    },
  };
}

export default async function CyclePage({
  params,
}: {
  params: Promise<{ cycle: string }>;
}) {
  const { cycle } = await params;
  type Cycle = (typeof cycles)[number];

  let foundCycle: Cycle | undefined;
  if (cycle) {
    foundCycle = cycles.find((x: { slug: ParamValue }) => x.slug === cycle);
  }

  if (!foundCycle) notFound();

  const rarity = cycleRarity(foundCycle);

  return (
    <div className="px-12 py-8">
      {/* Duplicado por idioma porque <nav> só recebe nome por aria-label, e
          atributo não é alcançado pelo CSS que troca o idioma. O mesmo
          data-t do <T> esconde o que não está ativo. */}
      <nav aria-label="Trilha" data-t="pt" className={CRUMB}>
        <Link href="/ciclos" className={CRUMB_LINK}>
          Ciclos
        </Link>
        {" / "}
        {foundCycle.name.pt ?? ""}
      </nav>
      <nav aria-label="Breadcrumb" data-t="en" className={CRUMB}>
        <Link href="/ciclos" className={CRUMB_LINK}>
          Cycles
        </Link>
        {" / "}
        {foundCycle.name.en ?? ""}
      </nav>
      <h1 className="font-serif text-7xl font-bold">
        <T pt={foundCycle.name.pt ?? ""} en={foundCycle.name.en ?? ""} />
      </h1>
      <span className="flex w-90 justify-between items-center text-2xl font-semibold mb-2.5">
        {foundCycle?.setName ? foundCycle.setName : ""} .{" "}
        {foundCycle?.year ? foundCycle.year : ""}
        {foundCycle && <SetSymbol singleCycle={foundCycle} size="1.5rem" />}
      </span>
      {rarity && (
        <p className="text-[11.5px] font-medium tracking-[0.14em] text-muted uppercase">
          <T {...RARITY_LABELS[rarity]} />
        </p>
      )}
      <br />
      <Ornament stretch />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5 sm:gap-6.5 mt-8">
        {foundCycle &&
          foundCycle.cards.map((card) =>
            "image" in card ? (
              <div
                key={card.image}
                className="flex flex-col gap-2.5 group relative"
              >
                <Image
                  src={card.image}
                  alt={card.name}
                  width={488}
                  height={680}
                  unoptimized
                  className="h-auto w-full rounded-[11px] shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
                />
                <Image
                  src={card.image}
                  alt={card.name}
                  width={488}
                  height={680}
                  unoptimized
                  className="opacity-0 scale-150 z-10 pointer-events-none group-hover:opacity-100 absolute h-auto w-full rounded-[11px] shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14.5px] font-semibold">
                    {card.name}
                  </span>
                </div>
              </div>
            ) : null,
          )}
      </div>
    </div>
  );
}

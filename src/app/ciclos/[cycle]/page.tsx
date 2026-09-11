
import Image from "next/image";
import Link from "next/link";
import { Ornament } from "@/components/Ornament";
import { T } from "@/components/T";

import { ParamValue } from "next/dist/server/request/params";
import { notFound } from "next/navigation";
import cycles from "@cycles";
import { cycleArt, cycleRarity, cycleSetLine } from "@/lib/cycles";
import { RARITY_LABELS } from "@/lib/filters";

import SetSymbol from "@/components/setSymbol";

import type { Metadata } from "next";

// A lista de slugs é completa e vem do JSON gerado, então nada precisa ser
// renderizado sob demanda: slug fora dela responde 404. Foi esta linha que
// consertou o 404 enquanto ciclos/loading.tsx existia — a boundary dele
// começava o streaming antes do notFound() e o status saía 200. O loading foi
// removido; a linha fica.
export const dynamicParams = false;

const CRUMB = "text-ui text-muted";
const CRUMB_LINK = "underline-offset-2 hover:text-gold hover:underline";

// Uma <Image> só por carta. O zoom é transform, que não ocupa espaço no fluxo,
// então nenhuma célula do grid se mexe. z-10 no hover põe a carta ampliada
// acima das vizinhas — o mesmo papel que o `absolute z-10` da cópia antiga.
// Sem transição, de propósito: o zoom de hoje é instantâneo nos dois sentidos
// e a troca aqui é de markup, não de comportamento.
//
// pointer-events-none não é detalhe: a imagem ampliada cobre a legenda da
// própria carta (25% de altura a mais para baixo) e invade a coluna vizinha.
// Com eventos ligados ela interceptaria o clique do link da Scryfall logo
// abaixo dela. O hover continua vindo da caixa do .group, que não escala.
const CARD_ART =
  "pointer-events-none relative z-0 h-auto w-full rounded-[11px] shadow-art " +
  "group-hover:z-10 group-hover:scale-150";

const CARD_NAME = "min-w-0 text-ui font-semibold";
const CARD_NAME_LINK = `${CARD_NAME} underline-offset-2 hover:text-gold hover:underline`;

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
    <div className="page-shell py-8">
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
      <h1 className="font-serif display-1 font-bold">
        <T pt={foundCycle.name.pt ?? ""} en={foundCycle.name.en ?? ""} />
      </h1>
      {/* max-w e não w: 360px cravados estouravam os 279px úteis de um
          viewport de 375px. */}
      <span className="flex w-full max-w-90 justify-between items-center text-title font-semibold mb-2">
        {cycleSetLine(foundCycle) ?? <T pt="Vários sets" en="Multiple sets" />}
        <SetSymbol singleCycle={foundCycle} size="1.5rem" />
      </span>
      {rarity && (
        <p className="text-meta font-medium tracking-[0.14em] text-muted uppercase">
          <T {...RARITY_LABELS[rarity]} />
        </p>
      )}
      <Ornament stretch className="mt-6" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 sm:gap-6 mt-8">
        {foundCycle &&
          foundCycle.cards.map((card) => {
            if (!("image" in card)) return null;

            // https://scryfall.com/card/<id> responde 301 para a URL canônica
            // (/card/bbd/25/brightling) — conferido por curl. É a forma estável:
            // não depende de set nem de collector number, que mudam de reprint.
            const scryfallUrl =
              "scryfallId" in card
                ? `https://scryfall.com/card/${card.scryfallId}`
                : null;

            // `namePt` só existe onde a carta foi impressa em português — os
            // sets de 1993-1995 e os produtos English-only nunca saíram. Sem o
            // campo, imprime o nome em inglês SEM o <T>: dois ramos com o mesmo
            // texto duplicariam o HTML de graça, e são 951 páginas.
            const namePt = "namePt" in card ? card.namePt : null;
            const typeLinePt = "typeLinePt" in card ? card.typeLinePt : null;

            return (
              // A chave era a URL da imagem, que ia inteira para o payload RSC.
              // O nome é único dentro de um ciclo (conferido nos 951) e curto.
              <div key={card.name} className="group relative flex flex-col gap-2">
                <Image
                  src={card.image}
                  alt={card.name}
                  width={488}
                  height={680}
                  unoptimized
                  className={CARD_ART}
                />
                <div className="flex flex-col gap-1">
                  <span className="flex items-start justify-between gap-2">
                    {/* Nova aba: o catálogo tem 951 ciclos e o estado de filtro
                        vive nos searchParams de /ciclos — mandar o visitante
                        para fora na mesma aba custa o lugar onde ele estava.
                        O aviso vai em sr-only porque aria-label é atributo e o
                        CSS que troca o idioma não alcança atributo. */}
                    {scryfallUrl ? (
                      <a
                        href={scryfallUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={CARD_NAME_LINK}
                      >
                        {namePt ? <T pt={namePt} en={card.name} /> : card.name}
                        <span className="sr-only">
                          {" "}
                          <T
                            pt="na Scryfall (abre em nova aba)"
                            en="on Scryfall (opens in a new tab)"
                          />
                        </span>
                      </a>
                    ) : (
                      <span className={CARD_NAME}>
                        {namePt ? <T pt={namePt} en={card.name} /> : card.name}
                      </span>
                    )}
                  </span>
                  {/* Mesma regra do nome: `typeLinePt` só existe onde a carta
                      saiu em português, e sem ele o inglês vai sem o <T>. */}
                  {"typeLine" in card && (
                    <span className="text-meta leading-snug text-muted">
                      {typeLinePt ? (
                        <T pt={typeLinePt} en={card.typeLine} />
                      ) : (
                        card.typeLine
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}


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
// renderizado sob demanda. Sem isso, a boundary de ciclos/loading.tsx começa
// o streaming antes do notFound() e o 404 vira 200.
export const dynamicParams = false;

const CRUMB = "text-[13px] text-muted";
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

const CARD_NAME = "min-w-0 text-[14.5px] font-semibold";
const CARD_NAME_LINK = `${CARD_NAME} underline-offset-2 hover:text-gold hover:underline`;

// O valor de mana imita o custo genérico da carta: numeral dentro de um círculo,
// no canto oposto ao nome. min-w-5 + px-1 para o círculo crescer em vez de cortar
// quando o custo tem dois dígitos. O rótulo é sr-only porque um numeral solto não
// se explica sozinho para quem não vê o desenho.
const CARD_CMC =
  "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full " +
  "border border-chip-border px-1 text-[11px] font-semibold text-chip-foreground tabular-nums";

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
      <h1 className="font-serif display-1 font-bold text-balance">
        <T pt={foundCycle.name.pt ?? ""} en={foundCycle.name.en ?? ""} />
      </h1>
      {/* max-w e não w: 360px cravados estouravam os 279px úteis de um
          viewport de 375px. */}
      <span className="flex w-full max-w-90 justify-between items-center text-2xl font-semibold mb-2.5">
        {cycleSetLine(foundCycle) ?? <T pt="Vários sets" en="Multiple sets" />}
        <SetSymbol singleCycle={foundCycle} size="1.5rem" />
      </span>
      {rarity && (
        <p className="text-[11.5px] font-medium tracking-[0.14em] text-muted uppercase">
          <T {...RARITY_LABELS[rarity]} />
        </p>
      )}
      <Ornament stretch className="mt-6" />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5 sm:gap-6.5 mt-8">
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

            return (
              // A chave era a URL da imagem, que ia inteira para o payload RSC.
              // O nome é único dentro de um ciclo (conferido nos 951) e curto.
              <div key={card.name} className="group relative flex flex-col gap-2.5">
                <Image
                  src={card.image}
                  alt={card.name}
                  width={488}
                  height={680}
                  unoptimized
                  className={CARD_ART}
                />
                <div className="flex flex-col gap-0.5">
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
                        {card.name}
                        <span className="sr-only">
                          {" "}
                          <T
                            pt="na Scryfall (abre em nova aba)"
                            en="on Scryfall (opens in a new tab)"
                          />
                        </span>
                      </a>
                    ) : (
                      <span className={CARD_NAME}>{card.name}</span>
                    )}
                    {/* A guarda é pela chave, não pelo valor: 30 cartas do
                        catálogo têm cmc 0, e um `card.cmc && …` sumiria com
                        elas. */}
                    {"cmc" in card && (
                      <span className={CARD_CMC}>
                        <span className="sr-only">
                          <T pt="Valor de mana " en="Mana value " />
                        </span>
                        {card.cmc}
                      </span>
                    )}
                  </span>
                  {/* typeLine vem da Scryfall já em inglês, como o nome da
                      carta — não passa pelo <T>. */}
                  {"typeLine" in card && (
                    <span className="text-[12px] leading-snug text-muted">
                      {card.typeLine}
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

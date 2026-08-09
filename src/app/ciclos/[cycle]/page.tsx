
import Image from "next/image";
import { Ornament } from "@/components/Ornament";

import { ParamValue } from "next/dist/server/request/params";
import { notFound } from "next/navigation";
import cycles from "@cycles";

import SetSymbol from "@/components/setSymbol";

import type { Metadata } from "next";

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

  return {
    title: set ? `${name} — ${set}` : name,
    description: set
      ? `As cinco cartas do ciclo ${name}, do set ${set}.`
      : `As cinco cartas do ciclo ${name}.`,
    alternates: { canonical: `/ciclos/${found.slug}` },
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

  return (
    <div className="px-12 py-8">
      <span>Ciclos/{foundCycle?.name?.pt ? foundCycle.name.pt : ""}</span>
      <h1 className="font-serif text-7xl font-bold">
        {foundCycle?.name?.pt ? foundCycle.name.pt : ""}
      </h1>
      <span className="flex w-90 justify-between items-center text-2xl font-semibold mb-2.5">
        {foundCycle?.setName ? foundCycle.setName : ""} .{" "}
        {foundCycle?.year ? foundCycle.year : ""}
        {foundCycle && <SetSymbol singleCycle={foundCycle} size="1.5rem" />}
      </span>
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

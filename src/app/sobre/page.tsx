import type { Metadata } from "next";
import { Ornament } from "@/components/Ornament";
import { T } from "@/components/T";
import Image from "next/image";

import cycles from "@cycles";
import { cardThumb } from "@/lib/cycles";

export const metadata: Metadata = {
  title: "O que é um ciclo?",
  description:
    "Um ciclo é um grupo de cartas irmãs impressas no mesmo set: mesmo tema, mesma mecânica, geralmente uma carta para cada cor de Magic.",
  alternates: { canonical: "/sobre" },
};

export default function About() {
  type Cycle = (typeof cycles)[number];
  const uniqueCycle: Cycle = cycles[0];

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-[22px] pt-10 pb-9 sm:gap-6.5 sm:px-8 sm:pt-16 sm:pb-18">
      <Ornament rule="w-11 sm:w-16" />

      <h1 className="text-center font-serif text-[34px] leading-[1.05] font-bold sm:text-[46px]">
        <T pt="O que é um ciclo?" en="What is a cycle?" />
      </h1>

      <p className="text-[14.5px] leading-[1.7] text-pretty text-secondary-body sm:text-[15.5px] sm:leading-[1.75]">
        <T
          pt={
            <>
              Um <em>ciclo</em> é um grupo de cartas irmãs impressas no mesmo
              set: mesmo tema, mesma mecânica, geralmente uma carta para cada
              uma das cinco cores de Magic.
            </>
          }
          en={
            <>
              A <em>cycle</em> is a group of sibling cards printed in the same
              set: same theme, same mechanic, usually one card for each of
              Magic&rsquo;s five colors.
            </>
          }
        />
      </p>

      <figure className="flex flex-col gap-2.5 sm:gap-3.5">
        <div className="flex justify-center gap-1.5 sm:gap-2">
          {uniqueCycle.cards.map((card) =>
            "image" in card ? (
              <Image
                key={card.image}
                src={cardThumb(card.image)}
                alt={card.name}
                width={104}
                height={145}
                unoptimized
                className="h-auto w-16 rounded-[5px] shadow-card sm:w-26 sm:rounded-md"
              />
            ) : null,
          )}
        </div>
        <figcaption className="text-center text-[11.5px] text-muted sm:text-xs">
          <T pt={uniqueCycle.name.pt} en={uniqueCycle.name.en} />
          {uniqueCycle.setName ? ` — ${uniqueCycle.setName}` : ""}
        </figcaption>
      </figure>

      <p className="text-[14.5px] leading-[1.7] text-pretty text-secondary-body sm:text-[15.5px] sm:leading-[1.75]">
        <T
          pt="Nem todo ciclo é de cinco monocolores: há ciclos de artefatos e de terrenos — como os cinco Moxen de Alpha. A Ciclopédia cataloga todos eles, de 1993 até hoje."
          en="Not every cycle is five mono-colored cards: there are cycles of artifacts and of lands — like the five Moxen from Alpha. Ciclopédia catalogs them all, from 1993 to today."
        />
      </p>

      <Ornament stretch />

      <p className="text-[13px] leading-[1.65] text-pretty text-secondary sm:text-[15.5px] sm:leading-[1.75] sm:text-secondary-body">
        <T
          pt={
            <>
              Projeto de fã, sem fins lucrativos. Dados e imagens da API pública
              da{" "}
              <a
                href="https://scryfall.com/"
                className="text-gold hover:underline"
              >
                Scryfall
              </a>
              . Magic: The Gathering é marca da Wizards of the Coast.
            </>
          }
          en={
            <>
              A non-commercial fan project. Data and images from the public{" "}
              <a
                href="https://scryfall.com/"
                className="text-gold hover:underline"
              >
                Scryfall
              </a>{" "}
              API. Magic: The Gathering is a trademark of Wizards of the Coast.
            </>
          }
        />
      </p>
    </div>
  );
}

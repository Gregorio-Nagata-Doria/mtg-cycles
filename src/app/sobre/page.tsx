import { Ornament } from "@/components/Ornament";
import Image from "next/image";

import cycles from "@cycles";

export default function About() {
  type Cycle = (typeof cycles)[number];
  const uniqueCycle: Cycle = cycles[0];

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-[22px] pt-10 pb-9 sm:gap-6.5 sm:px-8 sm:pt-16 sm:pb-18">
      <Ornament rule="w-11 sm:w-16" />

      <h1 className="text-center font-serif text-[34px] leading-[1.05] font-bold sm:text-[46px]">
        O que é um ciclo?
      </h1>

      <p className="text-[14.5px] leading-[1.7] text-pretty text-secondary-body sm:text-[15.5px] sm:leading-[1.75]">
        Um <em>ciclo</em> é um grupo de cartas irmãs impressas no mesmo set:
        mesmo tema, mesma mecânica, geralmente uma carta para cada uma das cinco
        cores de Magic.
      </p>

      <figure className="flex flex-col gap-2.5 sm:gap-3.5">
        <div className="flex justify-center gap-1.5 sm:gap-2">
          {uniqueCycle.cards.map((card) =>
            "image" in card ? (
              <Image
                key={card.image}
                src={card.image}
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
          {uniqueCycle.name.pt} — {uniqueCycle.setName}
        </figcaption>
      </figure>

      <p className="text-[14.5px] leading-[1.7] text-pretty text-secondary-body sm:text-[15.5px] sm:leading-[1.75]">
        Nem todo ciclo é de cinco monocolores: há ciclos de dez cartas em pares,
        de artefatos e de terrenos — como as duais originais de Alpha. A
        Ciclopédia cataloga todos eles, de 1993 até hoje.
      </p>

      <Ornament stretch />

      <p className="text-[13px] leading-[1.65] text-pretty text-secondary sm:text-[15.5px] sm:leading-[1.75] sm:text-secondary-body">
        Projeto de fã, sem fins lucrativos. Dados e imagens da API pública da{" "}
        <a href="https://scryfall.com/" className="text-gold hover:underline">
          Scryfall
        </a>
        . Magic: The Gathering é marca da Wizards of the Coast.
      </p>
    </div>
  );
}

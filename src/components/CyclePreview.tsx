
import Link from "next/link";
import cycles from "@cycles";
import { cardThumb, cycleRarity, cycleSetLine } from "@/lib/cycles";
import { RARITY_LABELS } from "@/lib/filters";
import { setSymbolSvg } from "@/lib/setSymbols";
import { CardFan } from "./CardFan";
import { T } from "./T";
type Cycle = (typeof cycles)[number];

export function CyclePreview({ singleCycle }: { singleCycle: Cycle }) {
  const svg = setSymbolSvg(singleCycle);
  const rarity = cycleRarity(singleCycle);
  const setLine = cycleSetLine(singleCycle);

  const images = singleCycle.cards.flatMap((card) =>
    "image" in card ? [{ src: cardThumb(card.image), alt: card.name }] : [],
  );

  return (
    <Link
      href={`/ciclos/${singleCycle.slug}`}
      className="block w-[300px] bg-panel border-border-card border rounded-2xl px-4 py-3"
    >
      <CardFan images={images} />{" "}
      <span className="font-serif text-[20px] font-bold">
        <T pt={singleCycle.name.pt} en={singleCycle.name.en} />
      </span>
      <br />
      <div className="flex flex-row items-center justify-between">
        <span>
          {setLine ?? <T pt="Vários sets" en="Multiple sets" />}
        </span>
        <span className="flex items-center gap-2">
          {rarity && (
            <span className="text-[10.5px] font-medium tracking-[0.12em] text-muted uppercase">
              <T {...RARITY_LABELS[rarity]} />
            </span>
          )}
          {/* O nome sai para um irmão sr-only porque o innerHTML ocupa o
              conteúdo do <span> e aria-label não é traduzível por CSS. */}
          {svg && (
            <>
              <span
                aria-hidden="true"
                className="inline-block h-4 w-4 **:fill-current [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <span className="sr-only">
                <T pt="símbolo do set" en="set symbol" />
              </span>
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

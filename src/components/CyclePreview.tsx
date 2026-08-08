
import Image from "next/image";
import Link from "next/link";
import cycles from "@cycles";
type Cycle = (typeof cycles)[number];

export async function CyclePreview({ singleCycle }: { singleCycle: Cycle }) {
  let setSymbolSvg: string | null = null;
  if (singleCycle.setSymbol) {
    try {
      setSymbolSvg = await fetch(singleCycle.setSymbol).then((r) => r.text());
    } catch {
      setSymbolSvg = null;
    }
  }


  const fan = [
    "z-0 -rotate-16 translate-y-5 group-hover:-rotate-20 group-hover:translate-y-5.5",
    "z-10 -rotate-8 translate-y-1.5 group-hover:-rotate-10",
    "z-20 rotate-0 group-hover:rotate-0",
    "z-30 rotate-8 translate-y-1.5 group-hover:rotate-10",
    "z-40 rotate-16 translate-y-5 group-hover:rotate-20 group-hover:translate-y-5.5",
  ];



  function CardFan() {
    return singleCycle.cards.map((card, i) =>
      "image" in card ? (
        <Image
          src={card.image}
          alt={card.name}
          key={card.image}
          width={82}
          height={114}
          unoptimized
          className={`w-20.5 rounded-[5px] shadow-card transition-transform duration-200 ease-out ${fan[i]}`}
        />
      ) : null,
    );
  }

  return (
    <Link
      href={`/ciclos/${singleCycle.slug}`}
      className="block w-[300px] bg-panel b-border-card border rounded-2xl px-4 py-3"
    >
      <div className="group flex h-32.5  items-end justify-center overflow-hidden [&>*+*]:-ml-13">
        {CardFan()}
      </div>{" "}
      <span className="font-serif text-[20px] font-bold">
        {singleCycle.name.pt}
      </span>
      <br />
      <div className="flex flex-row justify-between">
        {" "}
        {singleCycle.setName} . {singleCycle.year}{" "}
        {setSymbolSvg && (
          <span
            aria-label="simbolo do set"
            role="img"
            className="inline-block h-4 w-4 **:fill-current [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: setSymbolSvg }}
          />
        )}
      </div>
    </Link>
  );
}

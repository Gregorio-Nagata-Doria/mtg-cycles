import { Button } from "@/components/Button";
import { List } from "@/components/List";
import { Ornament } from "@/components/Ornament";

export default function Home() {
  return (
    <div className="flex w-full flex-col items-center mx-auto py-32 px-16">
      <Ornament />
      <h1 className="font-serif font-black text-7xl">Ciclopédia</h1>
      <p className="mt-4 max-w-[560px] text-center text-[14.5px] leading-[1.7] text-pretty text-secondary-body sm:text-[15.5px] sm:leading-[1.75]">
        Um catálogo dos ciclos de Magic: The Gathering — grupos de cartas irmãs,
        uma por cor, reunidos como numa enciclopédia.
      </p>

      <div className="mt-7 mb-16 flex flex-wrap items-center justify-center gap-3">
        <Button text="Ver todos os ciclos" href="/ciclos" />
        <Button text="O que é um ciclo?" href="/sobre" variant="secondary" />
      </div>

      <section className="w-full">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-[28px] font-semibold">
            Ciclos em destaque
          </h2>
          <span className="flex-1 rule-fade" />
        </div>
        <List />
      </section>
    </div>
  );
}

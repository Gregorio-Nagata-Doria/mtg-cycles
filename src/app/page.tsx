import { Button } from "@/components/Button";
import { List } from "@/components/List";
import { Ornament } from "@/components/Ornament";

export default function Home() {
  return (
    <div className="flex w-screen flex-col items-center mx-auto py-32 px-16">
      <Ornament />
      <h1 className="font-serif font-black text-7xl">Ciclopédia</h1>
      <text>
        Um catálogo dos ciclos de Magic: The Gathering — grupos de cartas irmãs,
        uma por cor, reunidos como numa enciclopédia.
      </text>
      <Button text="Ver todos os ciclos" href="/ciclos" />
      <Button text="O que é um ciclo?" href="/sobre" />

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

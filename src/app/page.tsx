import { Button } from "@/components/Button";
import { List } from "@/components/List";
import { Ornament } from "@/components/Ornament";
import { T } from "@/components/T";

export default function Home() {
  return (
    <div className="page-shell flex flex-col items-center py-16 sm:py-24">
      <Ornament />
      <h1 className="font-serif font-bold display-1">Ciclopédia</h1>
      <p className="mt-4 max-w-[560px] text-center text-[14.5px] leading-[1.7] text-pretty text-secondary-body sm:text-[15.5px] sm:leading-[1.75]">
        <T
          pt="Um catálogo dos ciclos de Magic: The Gathering — grupos de cartas irmãs, uma por cor, reunidos como numa enciclopédia."
          en="A catalog of Magic: The Gathering cycles — groups of sibling cards, one per color, gathered as in an encyclopedia."
        />
      </p>

      <div className="mt-7 mb-16 flex flex-wrap items-center justify-center gap-3">
        <Button
          text={<T pt="Ver todos os ciclos" en="Browse all cycles" />}
          href="/ciclos"
        />
        <Button
          text={<T pt="O que é um ciclo?" en="What is a cycle?" />}
          href="/sobre"
          variant="secondary"
        />
      </div>

      <section className="w-full">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-[28px] font-semibold">
            <T pt="Ciclos em destaque" en="Featured cycles" />
          </h2>
          <span className="flex-1 rule-fade" />
        </div>
        <p className="mt-3 text-[13.5px] text-muted">
          <T
            pt="Seis ciclos cujas cinco artes foram feitas como um conjunto — uma carta por cor."
            en="Six cycles whose five arts were made as one set — one card per color."
          />
        </p>
        <List />
      </section>
    </div>
  );
}

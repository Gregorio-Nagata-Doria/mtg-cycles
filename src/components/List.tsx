import { FEATURED_CYCLES } from "@/lib/featured";
import { CyclePreview } from "./CyclePreview";

export function List() {
  return (
    // justify-center e não justify-between: com cards de largura fixa que
    // quebram linha, o `between` dava à última linha gutters diferentes das
    // anteriores — espaçamento virava ruído em vez de agrupamento.
    <div className="mt-8 w-full flex sm:flex-row flex-col flex-wrap gap-8 justify-center items-center">
      {FEATURED_CYCLES.map((cycle) => (
        <CyclePreview key={cycle.slug} singleCycle={cycle} />
      ))}
    </div>
  );
}

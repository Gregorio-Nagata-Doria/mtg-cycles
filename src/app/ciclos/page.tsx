import type { Metadata } from "next";
import { CycleCatalog } from "@/components/CycleCatalog";
import { CyclePreview } from "@/components/CyclePreview";
import { buildCycleIndex, firstCycles, listSets, listYears } from "@/lib/cycles";
import { PER_PAGE } from "@/lib/filters";

const PATH = "/ciclos";

export const metadata: Metadata = {
  title: "Todos os ciclos",
  description:
    "Navegue pelos 951 ciclos de Magic: The Gathering catalogados, com busca por nome e filtro por set, raridade, estrutura, cor e ano.",
  alternates: { canonical: PATH },
};

// Página estática (○). Ela não lê `searchParams` — era isso que a tornava
// dinâmica (ƒ). Quem filtra é o navegador, a partir do índice enxuto que sai
// daqui como prop; a URL continua sendo a fonte da verdade, só que lida do
// outro lado. Ver CycleCatalog.tsx.
//
// O que sobra no HTML: a vitrine dos 24 primeiros ciclos com o <CyclePreview>
// inteiro. É o que o Google e quem está sem JS enxergam, e é o mesmo conteúdo
// que a versão dinâmica entregava sem filtro nenhum.
export default function Catalogo() {
  return (
    <CycleCatalog
      index={buildCycleIndex()}
      sets={listSets()}
      years={listYears()}
    >
      <div className="flex flex-wrap gap-8">
        {firstCycles(PER_PAGE).map((cycle) => (
          <CyclePreview key={cycle.slug} singleCycle={cycle} />
        ))}
      </div>
    </CycleCatalog>
  );
}

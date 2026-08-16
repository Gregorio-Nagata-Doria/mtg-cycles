import cycles from "@cycles";
import { cycleStructure, type Cycle } from "@/lib/cycles";

const COUNT = 6;

// Prefixo próprio da semente. O hash do slug já escolhe a arte da og:image em
// cycleArt(); sem o prefixo as duas escolhas ficariam correlacionadas de graça.
const SEED = "destaque:";

// Mesmo hash de cycleArt() (src/lib/cycles.ts), e pelo mesmo motivo: espalha a
// escolha pelo catálogo como um sorteio, mas é função pura do slug, então dá o
// mesmo resultado em todo build. Math.random() — ou qualquer coisa derivada de
// Date.now() — congelaria num valor diferente a cada deploy: a primeira coisa
// da home mudaria sozinha entre um deploy e outro, sem ninguém ter mexido nela.
function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Quatro portões, todos sobre o que o card da home efetivamente mostra.
// O funil, medido no cycles.generated.json de 2026-08-16:
//
//   artCoherent ...... as 5 artes foram feitas como um conjunto. O card é um
//                      leque de 5 miniaturas encostadas; sem isso vira pilha
//                      de cartas avulsas.                          951 → 884
//   setName + year ... a segunda linha do card. Sem eles sai "Vários sets" e
//                      sem ano.                                    884 → 884
//   5-mono ........... o parágrafo logo acima da lista promete "uma por cor".
//                      Ciclo de artefatos ou de duplas contradiz a frase.
//                                                                  884 → 621
//   pt revisado ...... o nome é o maior texto do card e PT é o idioma padrão.
//                      456 dos 642 ciclos com ptReview têm name.pt idêntico ao
//                      name.en: inglês cru. Não é o que abre o site.
//                                                                  621 → 171
//
// O portão de set/ano não derruba ninguém hoje — os 10 ciclos sem set são todos
// artCoherent: false. Fica porque é ele que garante a segunda linha do card, e
// no dia em que os dados mudarem passa a valer sem ninguém precisar notar.
const pool = cycles.filter(
  (cycle) =>
    cycle.artCoherent &&
    Boolean(cycle.setName) &&
    Boolean(cycle.year) &&
    !("ptReview" in cycle.name) &&
    cycleStructure(cycle) === "5-mono",
);

// Slug como desempate para a ordem ser total: assim o resultado não depende de
// o sort do runtime ser estável.
const ordered = pool
  .map((cycle) => ({ cycle, rank: hash(SEED + cycle.slug) }))
  .sort((a, b) => a.rank - b.rank || a.cycle.slug.localeCompare(b.cycle.slug))
  .map(({ cycle }) => cycle);

// Um set por card. Dois "Commander 2020" lado a lado na mesma fileira parecem
// erro de renderização, não curadoria. O critério é setName e não setCode
// porque setName é o que aparece na tela — e setCode nem sempre é um set de
// verdade (em cycle-1mv-tutor o token do slug é "1mv").
const chosen: Cycle[] = [];
const usedSets = new Set<string>();
for (const cycle of ordered) {
  if (chosen.length === COUNT) break;
  const set = cycle.setName ?? "";
  if (usedSets.has(set)) continue;
  usedSets.add(set);
  chosen.push(cycle);
}

// Rede de segurança: o pool tem quase 100 sets distintos, então o laço acima
// sempre fecha em 6. Se um dia os dados encolherem, repetir set é menos ruim do
// que a fileira da home aparecer com um buraco.
for (const cycle of ordered) {
  if (chosen.length === COUNT) break;
  if (!chosen.includes(cycle)) chosen.push(cycle);
}

export const FEATURED_CYCLES: Cycle[] = chosen;

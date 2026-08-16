import cycles from "@cycles";
import type { CycleIndex, CycleRow } from "./cyclesIndex";

export type Cycle = (typeof cycles)[number];

const WUBRG = "WUBRG";

const ALLIED = new Set(["WU", "UB", "BR", "RG", "WG"]);
const ENEMY = new Set(["WB", "UR", "BG", "WR", "UG"]);

const RARITY_ORDER = ["common", "uncommon", "rare", "mythic"];

function colorKey(colors: string[]): string {
  return [...colors]
    .sort((a, b) => WUBRG.indexOf(a) - WUBRG.indexOf(b))
    .join("");
}

// "Set . Ano" para exibir, ou null quando o ciclo não tem set — as cartas dele
// vêm de sets diferentes (cycle-morphling espalha por 5). São 10 ciclos.
// Sem isto o JSX imprimia o separador sozinho: " . ".
export function cycleSetLine(cycle: Cycle): string | null {
  if (!cycle.setName) return null;
  return cycle.year ? `${cycle.setName} . ${cycle.year}` : cycle.setName;
}

export function cycleRarity(cycle: Cycle): string | null {
  const count: Record<string, number> = {};
  for (const card of cycle.cards) {
    if (!("rarity" in card)) continue;
    count[card.rarity] = (count[card.rarity] ?? 0) + 1;
  }
  const ranked = Object.keys(count).sort(
    (a, b) =>
      count[b] - count[a] || RARITY_ORDER.indexOf(b) - RARITY_ORDER.indexOf(a),
  );
  return ranked[0] ?? null;
}

export function cycleStructure(cycle: Cycle): string | null {
  const cards = cycle.cards.filter((card) => "typeLine" in card);
  if (cards.length === 0) return null;

  const keys = cards.map((card) => colorKey(card.colors));

  if (cards.every((card) => card.typeLine.includes("Land"))) return "terras";
  if (cards.every((c, i) => c.typeLine.includes("Artifact") && keys[i] === ""))
    return "artefatos";
  if (cards.length === 5 && keys.every((k) => k.length === 1) && new Set(keys).size === 5)
    return "5-mono";
  if (cards.length === 10 && keys.every((k) => k.length === 2)) return "10-duplas";
  if (cards.length === 5 && keys.every((k) => ALLIED.has(k))) return "5-aliadas";
  if (cards.length === 5 && keys.every((k) => ENEMY.has(k))) return "5-inimigas";
  return null;
}

// O JSON guarda só a imagem `normal` da Scryfall (488px, ~76 KB). Onde a carta
// aparece como miniatura isso é desperdício puro — a `small` (146px, ~11 KB) é a
// mesma URL com um segmento trocado, verificado contra a API.
// Não virou campo no JSON de propósito: seriam ~4750 URLs a mais (+14% no
// arquivo) para guardar o que uma substituição reproduz sem perda.
export function cardThumb(image: string): string {
  return image.replace("/normal/", "/small/");
}

// Sorteio estável: espalha uma escolha pelo catálogo como um sorteio, mas é
// função pura do texto, então dá o mesmo resultado em todo build. Math.random()
// — ou qualquer coisa derivada de Date.now() — congelaria num valor diferente a
// cada deploy. Duas coisas dependem disso e quebrariam de formas diferentes: a
// og:image de cada ciclo invalidaria o cache de quem já compartilhou o link, e
// a primeira coisa da home mudaria sozinha entre um deploy e outro.
// Quem usa isto para outra escolha deve prefixar o texto com uma semente
// própria, senão as duas escolhas ficam correlacionadas de graça.
export function hashSlug(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Arte de uma das cartas do ciclo, para a og:image.
export function cycleArt(cycle: Cycle): { url: string; name: string } | null {
  const arts = cycle.cards.flatMap((card) =>
    "artCrop" in card ? [{ url: card.artCrop, name: card.name }] : [],
  );
  if (arts.length === 0) return null;

  return arts[hashSlug(cycle.slug) % arts.length];
}

// União WUBRG das cartas do ciclo; "" quando nenhuma carta tem cor (artefato,
// terreno). Cor não é campo do JSON — sai das cartas, como a estrutura.
// ⚠️ É uma dimensão fraca por natureza do dado: 890 dos 951 ciclos dão WUBRG,
// porque um ciclo quase sempre cobre as cinco cores. O que ela separa de fato
// são os 50 incolores e os 11 parciais.
export function cycleColors(cycle: Cycle): string {
  const present = new Set<string>();
  for (const card of cycle.cards) {
    if (!("colors" in card)) continue;
    for (const color of card.colors) present.add(color);
  }
  return [...present].sort((a, b) => WUBRG.indexOf(a) - WUBRG.indexOf(b)).join("");
}

export function listSets(): { code: string; name: string }[] {
  const byCode = new Map<string, string>();
  for (const cycle of cycles) {
    if (!cycle.setCode || !cycle.setName) continue;
    byCode.set(cycle.setCode, cycle.setName);
  }
  return [...byCode]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

// Descendente: o filtro de ano mostra os mais recentes primeiro, que é o que
// alguém procura. Os 10 ciclos sem ano ficam fora da lista — não têm ano
// porque as cartas vêm de sets diferentes, e chutar um seria inventar dado.
export function listYears(): number[] {
  const years = new Set<number>();
  for (const cycle of cycles) if (cycle.year) years.add(cycle.year);
  return [...years].sort((a, b) => b - a);
}

// Os primeiros ciclos do catálogo, na ordem do JSON: é a vitrine que o HTML
// estático de /ciclos carrega, com o <CyclePreview> inteiro. Tudo além disso é
// o cliente que monta, a partir do índice.
export function firstCycles(count: number): Cycle[] {
  return cycles.slice(0, count);
}

// Monta o payload que vai para o navegador como prop. Roda no servidor, no
// build, uma vez — é o único ponto em que o JSON de 3,1 MB vira os ~14 KB que
// o cliente recebe. Ver o formato de arame em cyclesIndex.ts.
export function buildCycleIndex(): CycleIndex {
  const sets: [string, string][] = [];
  const setIds = new Map<string, number>();

  function setId(code: string | null, name: string | null): number {
    if (!code || !name) return -1;
    const known = setIds.get(code);
    if (known !== undefined) return known;
    setIds.set(code, sets.length);
    sets.push([code, name]);
    return sets.length - 1;
  }

  const rows: CycleRow[] = cycles.map((cycle) => [
    cycle.slug.replace(/^cycle-/, ""),
    cycle.name.pt,
    cycle.name.en === cycle.name.pt ? 0 : cycle.name.en,
    setId(cycle.setCode, cycle.setName),
    cycle.year ?? 0,
    cycleRarity(cycle) ?? "",
    cycleStructure(cycle) ?? "",
    cycleColors(cycle),
  ]);

  return { sets, rows };
}

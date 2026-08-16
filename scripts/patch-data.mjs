// -------------------------------------------------------------------------
// Corrige cycles.generated.json NO LUGAR, sem refazer o fetch do catalogo.
// Roda 1x: `node scripts/patch-data.mjs`
//
// Existe porque rodar build-cycles.mjs de novo custaria caro demais pelo que
// conserta: ele refaz o fetch das ~4750 cartas, e as URLs de imagem da Scryfall
// carregam um timestamp de cache-bust — todas mudariam, inclusive as og:image
// ja compartilhadas. Alem disso ele reescreve o arquivo inteiro e apaga o campo
// `name`, que quem grava e o build-names.mjs, depois.
//
// As duas correcoes ja estao aplicadas no build-cycles.mjs tambem, entao um
// build futuro nasce certo e este script vira no-op.
//
// Passada 1: preenche as cartas que ficaram {missing:true} por nome errado do
//            tagger (ver cycles.overrides.json). 1 request.
// Passada 2: recalcula setName/year a partir da carta do PROPRIO set do ciclo.
// -------------------------------------------------------------------------
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const UA = "mtg-cycles/1.0";
const HERE = dirname(fileURLToPath(import.meta.url));
const CYCLES = join(HERE, "cycles.generated.json");
const OVERRIDES_FILE = join(HERE, "cycles.overrides.json");

const COLOR_ORDER = { W: 0, U: 1, B: 2, R: 3, G: 4 };
const colorKey = (c) =>
  c.colors?.length ? Math.min(...c.colors.map((x) => COLOR_ORDER[x] ?? 9)) : 9;

// De qual carta sair setName/year. Mesma regra do build-cycles.mjs — se um
// mudar, mude os dois.
//
// 1. a carta do proprio set do ciclo, quando existe. Sem isso, um ciclo do
//    Alpha exibia "Ninth Edition" so porque a reimpressao ficava em 1o na
//    ordenacao por cor.
// 2. senao, o set unanime das cartas. O segundo token do slug nem sempre e um
//    set de verdade (cycle-1mv-tutor, cycle-da1-charm): ali nenhuma carta bate
//    com o "setCode", mas as 5 sao do mesmo set e esse set e a resposta certa.
// 3. senao, null: o ciclo e espalhado (cycle-morphling, 5 sets diferentes) e
//    inventar um set e pior do que nao ter.
export function setSource(cards, setCode) {
  const withSet = cards.filter((c) => c.set);
  if (withSet.length === 0) return null;
  const own = withSet.find((c) => c.set === setCode);
  if (own) return own;
  const distinct = new Set(withSet.map((c) => c.set));
  return distinct.size === 1 ? withSet[0] : null;
}

// Mesma forma de carta que o build-cycles.mjs grava. Se um mudar, mude os dois.
function slimCard(c) {
  const face = c.image_uris ? c : c.card_faces?.[0];
  return {
    name: c.name,
    colors: c.colors ?? c.card_faces?.flatMap((f) => f.colors ?? []) ?? [],
    set: c.set,
    setName: c.set_name,
    collectorNumber: c.collector_number,
    rarity: c.rarity,
    cmc: c.cmc,
    typeLine: c.type_line,
    releasedAt: c.released_at,
    image: face?.image_uris?.normal ?? null,
    artCrop: face?.image_uris?.art_crop ?? null,
    scryfallId: c.id,
  };
}

const cycles = JSON.parse(await readFile(CYCLES, "utf8"));
const overrides = Object.fromEntries(
  Object.entries(JSON.parse(await readFile(OVERRIDES_FILE, "utf8"))).filter(
    ([k]) => !k.startsWith("_"),
  ),
);

// -------------------------------------------------------------------------
// Passada 1 — cartas faltando
// -------------------------------------------------------------------------
const wanted = new Map(); // nome corrigido -> nome como esta no JSON
for (const cy of cycles) {
  for (const card of cy.cards) {
    if (!card.missing) continue;
    const fixed = overrides[card.name];
    if (fixed) wanted.set(fixed, card.name);
  }
}

let filled = 0;
if (wanted.size === 0) {
  console.log("1. nenhuma carta faltando com override — nada a buscar");
} else {
  console.log(`1. buscando ${wanted.size} cartas na Scryfall...`);
  const res = await fetch("https://api.scryfall.com/cards/collection", {
    method: "POST",
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifiers: [...wanted.keys()].map((name) => ({ name })),
    }),
  });
  const json = await res.json();

  const byName = new Map();
  for (const card of json.data ?? []) byName.set(card.name.toLowerCase(), card);

  for (const notFound of json.not_found ?? []) {
    console.warn(`   ⚠️  nao encontrada: ${JSON.stringify(notFound)}`);
  }

  for (const cy of cycles) {
    let touched = false;
    cy.cards = cy.cards.map((card) => {
      if (!card.missing) return card;
      const fixed = overrides[card.name];
      const found = fixed && byName.get(fixed.toLowerCase());
      if (!found) return card;
      touched = true;
      filled += 1;
      return slimCard(found);
    });
    // Reordena em WUBRG, como o build-cycles.mjs faz.
    if (touched) cy.cards.sort((a, b) => colorKey(a) - colorKey(b));
  }
  console.log(`   ${filled} cartas preenchidas`);
}

// -------------------------------------------------------------------------
// Passada 2 — setName/year saem da carta do proprio set
// -------------------------------------------------------------------------
const changes = [];
for (const cy of cycles) {
  const source = setSource(cy.cards, cy.setCode);
  const setName = source?.setName ?? null;
  const year = source?.releasedAt ? Number(source.releasedAt.slice(0, 4)) : null;

  if (cy.setName !== setName || cy.year !== year) {
    changes.push({
      slug: cy.slug,
      de: `${cy.setName ?? "null"} / ${cy.year ?? "null"}`,
      para: `${setName ?? "null"} / ${year ?? "null"}`,
    });
    cy.setName = setName;
    cy.year = year;
  }
}

console.log(`\n2. setName/year corrigidos em ${changes.length} ciclos:`);
for (const c of changes) console.log(`   ${c.slug}\n      ${c.de}  ->  ${c.para}`);

await writeFile(CYCLES, JSON.stringify(cycles, null, 2), "utf8");
console.log(`\nPronto: ${cycles.length} ciclos -> ${CYCLES}`);
console.log(`  cartas preenchidas:   ${filled}`);
console.log(`  setName/year mudados: ${changes.length}`);

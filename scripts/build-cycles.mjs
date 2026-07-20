// build-cycles.mjs — Opção B / estratégia 2C
// -------------------------------------------------------------------------
// Roda 1x na sua máquina: `node scripts/build-cycles.mjs`
// Congela os dados dos ciclos num JSON, pra o site não falar com o Scryfall.
//
// Pipeline:
//   1. Tagger GraphQL (1 chamada) -> todos os ciclos + cartas de cada um
//   2. filtra os ciclos de exatamente 5 cartas (o clássico WUBRG)
//   3. extrai o set de origem do slug (cycle-<SET>-<tema>) p/ arte coesa
//   4. POST /cards/collection em lotes de 75 -> dado completo + imagem coesa
//   5. fallback por nome puro pras cartas que nao existem no set do slug
//   6. grava scripts/cycles.generated.json
//
// So usa APIs nativas do Node 22 (fetch, getSetCookie). Zero dependencias.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const UA = "mtg-cycles/1.0";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "cycles.generated.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ordem WUBRG pra deixar as cartas do ciclo na sequencia canonica.
const COLOR_ORDER = { W: 0, U: 1, B: 2, R: 3, G: 4 };
const colorKey = (c) => (c.colors?.length ? Math.min(...c.colors.map((x) => COLOR_ORDER[x] ?? 9)) : 9);

// Carta split/dupla-face vem do Tagger como "A // B", mas o /cards/collection
// so acha pela meia-face ("A"). Entao enviamos a 1a face na busca.
const queryName = (name) => (name.includes(" // ") ? name.split(" // ")[0].trim() : name);

// Todas as formas pelas quais uma carta retornada pode ser referenciada:
// nome cheio, cada metade do "A // B", e o nome de cada face.
function nameVariants(card) {
  const v = new Set([card.name.toLowerCase()]);
  card.name.split(" // ").forEach((p) => v.add(p.trim().toLowerCase()));
  card.card_faces?.forEach((f) => f.name && v.add(f.name.toLowerCase()));
  return v;
}

// -------------------------------------------------------------------------
// 1. Sessao do Tagger: pega CSRF token + cookie carregando uma pagina HTML.
// -------------------------------------------------------------------------
async function taggerSession() {
  const res = await fetch("https://tagger.scryfall.com/", {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  const html = await res.text();
  const token = html.match(/<meta name="csrf-token" content="([^"]+)"/)?.[1];
  if (!token) throw new Error("CSRF token nao encontrado na pagina do Tagger");
  // getSetCookie() -> lista de "nome=valor; Path=...". Reenvia so o "nome=valor".
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  return { token, cookie };
}

// -------------------------------------------------------------------------
// 2. Query GraphQL: o tag guarda-chuva "cycle" e seus childTags.
//    So peco o que preciso (slug, contagem, nomes) pra resposta ser leve.
// -------------------------------------------------------------------------
async function fetchAllCycles({ token, cookie }) {
  const query = `query($t: TagType!, $s: String!) {
    tag: tagBySlug(type: $t, slug: $s, aliasing: true) {
      childTags {
        slug
        taggingCount
        taggings { results { card { name } } }
      }
    }
  }`;
  const res = await fetch("https://tagger.scryfall.com/graphql", {
    method: "POST",
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
      Cookie: cookie,
    },
    body: JSON.stringify({ query, variables: { t: "ORACLE_CARD_TAG", s: "cycle" } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error("Tagger GraphQL: " + JSON.stringify(json.errors));
  return json.data.tag.childTags;
}

// O set de origem esta codificado no slug: cycle-<SET>-<tema...>.
// Regra segura: e o token ENTRE o 1o e o 2o hifen (o tema pode ter hifens).
// Slugs sem terceiro token (ex.: cycle-shockland) nao tem set -> null.
function setCodeFromSlug(slug) {
  const parts = slug.split("-");
  return parts.length >= 3 && parts[0] === "cycle" ? parts[1] : null;
}

// -------------------------------------------------------------------------
// /cards/collection em lotes de 75 (teto rigido), ~100ms entre chamadas.
// identifiers: [{ name, set?, orig }]  (name = ja a face de busca; orig = chave)
// onResolved(id, card) e chamado pra cada carta achada.
// A ordem de data[] nao e garantida, entao casamos pelo mapa de variantes.
// -------------------------------------------------------------------------
async function batchCollection(identifiers, onResolved, label) {
  for (let i = 0; i < identifiers.length; i += 75) {
    const slice = identifiers.slice(i, i + 75);
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        identifiers: slice.map((id) => (id.set ? { name: id.name, set: id.set } : { name: id.name })),
      }),
    });
    const json = await res.json();
    // Mapa: cada variante de nome -> card retornado.
    const lookup = new Map();
    for (const card of json.data ?? []) for (const v of nameVariants(card)) lookup.set(v, card);
    for (const id of slice) {
      const card = lookup.get(id.name.toLowerCase());
      if (card) onResolved(id, card);
    }
    process.stdout.write(`\r  ${label}: ${Math.min(i + 75, identifiers.length)}/${identifiers.length}`);
    await sleep(100);
  }
  process.stdout.write("\n");
}

// So os campos que o site precisa (Opcao B = tudo congelado).
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

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------
console.log("1. abrindo sessao no Tagger...");
const session = await taggerSession();

console.log("2. buscando todos os ciclos (1 chamada GraphQL, pode demorar ~10s)...");
const all = await fetchAllCycles(session);
const cycles = all
  .filter((c) => c.taggingCount === 5)
  .map((c) => ({
    slug: c.slug,
    setCode: setCodeFromSlug(c.slug),
    names: c.taggings.results.map((r) => r.card.name),
  }));
console.log(`   ${all.length} ciclos no total -> ${cycles.length} com 5 cartas`);

// 3+4. 1a passada: {name, set} p/ arte coesa. Dedup por orig|set.
const setIds = new Map();
for (const cy of cycles) {
  if (!cy.setCode) continue;
  for (const name of cy.names) {
    const key = `${name}|${cy.setCode}`;
    if (!setIds.has(key)) setIds.set(key, { name: queryName(name), set: cy.setCode, orig: name });
  }
}
console.log(`3. ${setIds.size} identificadores {name,set} p/ enriquecer (arte coesa)`);
const bySetKey = new Map();
await batchCollection([...setIds.values()], (id, card) => bySetKey.set(`${id.orig}|${id.set}`, card), "coesa");

// 5. Fallback: toda carta ainda nao resolvida (not_found OU ciclo sem setCode)
//    vira uma busca por nome puro (dedup por nome).
const unresolved = new Map();
for (const cy of cycles) {
  for (const name of cy.names) {
    const resolved = cy.setCode && bySetKey.has(`${name}|${cy.setCode}`);
    if (!resolved && !unresolved.has(name)) unresolved.set(name, { name: queryName(name), orig: name });
  }
}
const byName = new Map();
if (unresolved.size) {
  console.log(`5. ${unresolved.size} cartas p/ fallback por nome (arte pode misturar)`);
  await batchCollection([...unresolved.values()], (id, card) => byName.set(id.orig, card), "fallback");
}

// 6. Monta o JSON final. Pra cada carta: tenta name|set (coesa), senao name.
const out = cycles.map((cy) => {
  let coherent = true;
  const cards = cy.names.map((name) => {
    const inSet = cy.setCode ? bySetKey.get(`${name}|${cy.setCode}`) : null;
    const card = inSet ?? byName.get(name);
    if (!inSet) coherent = false;
    return card ? slimCard(card) : { name, missing: true };
  });
  cards.sort((a, b) => colorKey(a) - colorKey(b));
  const first = cards.find((c) => c.set);
  return {
    slug: cy.slug,
    setCode: cy.setCode,
    setName: first?.setName ?? null,
    year: first?.releasedAt ? Number(first.releasedAt.slice(0, 4)) : null,
    artCoherent: coherent, // todas as 5 vieram do set de origem?
    cards,
  };
});

await writeFile(OUT, JSON.stringify(out, null, 2), "utf8");
const coherentCount = out.filter((c) => c.artCoherent).length;
const missing = out.reduce((n, c) => n + c.cards.filter((k) => k.missing).length, 0);
console.log(`\nPronto: ${out.length} ciclos -> ${OUT}`);
console.log(`  arte coesa (todas no set de origem): ${coherentCount}`);
console.log(`  arte misturada (algum fallback):     ${out.length - coherentCount}`);
console.log(`  cartas nao resolvidas (missing):     ${missing}`);

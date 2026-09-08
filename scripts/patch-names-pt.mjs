// -------------------------------------------------------------------------
// Preenche `namePt` nas cartas do cycles.generated.json, NO LUGAR.
// Roda 1x: `node scripts/patch-names-pt.mjs`
//
// Segue o precedente do patch-data.mjs, e pelo mesmo motivo: rodar o
// build-cycles.mjs de novo refaria o fetch das ~4750 cartas e as URLs de imagem
// da Scryfall carregam timestamp de cache-bust — TODAS mudariam, inclusive as
// og:image ja compartilhadas. Este script nao toca em `image` nem em `artCrop`:
// so acrescenta um campo.
//
// Passada 1: uma busca por SET (`set:x lang:pt`), nao uma por carta. Sao ~197
//            sets contra 4755 cartas — a impressao em PT guarda o mesmo
//            collector_number da inglesa, entao set+numero e chave suficiente.
// Passada 2: o que sobrou vai por NOME exato (`!"Nome" lang:pt`), porque uma
//            carta pode nao ter saido em PT naquele set mas ter saido em outro,
//            e o nome traduzido e o mesmo em qualquer impressao.
//
// O que fica sem `namePt` e o que nunca foi impresso em portugues — sets de
// 1993-1995 e produtos English-only. A UI cai no nome em ingles.
// -------------------------------------------------------------------------
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const UA = "mtg-cycles/1.0";
const HERE = dirname(fileURLToPath(import.meta.url));
const CYCLES = join(HERE, "cycles.generated.json");

// A Scryfall pede 50-100ms entre requests. 100 e o lado educado.
const PAUSA = 100;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function scryfall(url) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    // 404 = a busca nao achou nada. E resposta, nao falha: quer dizer que essa
    // carta/set nao existe em portugues.
    if (res.status === 404) return null;
    if (res.ok) return res.json();
    if (res.status === 429) {
      await espera(1000 * tentativa);
      continue;
    }
    throw new Error(`${res.status} em ${url}`);
  }
  throw new Error(`429 persistente em ${url}`);
}

// Busca paginada. `unique=prints` porque duas impressoes do mesmo set (normal e
// showcase) tem numeros diferentes e as duas precisam entrar no mapa.
async function busca(q) {
  const out = [];
  let url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=prints`;
  while (url) {
    const j = await scryfall(url);
    if (!j) break;
    out.push(...j.data);
    url = j.has_more ? j.next_page : null;
    await espera(PAUSA);
  }
  return out;
}

const cycles = JSON.parse(await readFile(CYCLES, "utf8"));
const cards = cycles.flatMap((cy) => cy.cards).filter((c) => !c.missing);

// -------------------------------------------------------------------------
// Passada 1 — por set
// -------------------------------------------------------------------------
const sets = [...new Set(cards.map((c) => c.set).filter(Boolean))].sort();
console.log(`Passada 1: ${sets.length} sets, ${cards.length} cartas.`);

const porNumero = new Map(); // "set/numero" -> printed_name
let n = 0;
for (const set of sets) {
  n += 1;
  const achados = await busca(`set:${set} lang:pt`);
  for (const c of achados) {
    if (c.printed_name) porNumero.set(`${c.set}/${c.collector_number}`, c.printed_name);
  }
  if (n % 25 === 0 || n === sets.length) {
    console.log(`  ${String(n).padStart(3)}/${sets.length} sets — ${porNumero.size} impressoes PT`);
  }
}

let porSet = 0;
for (const c of cards) {
  const pt = porNumero.get(`${c.set}/${c.collectorNumber}`);
  if (pt) {
    c.namePt = pt;
    porSet += 1;
  }
}

// -------------------------------------------------------------------------
// Passada 2 — o que sobrou, por nome exato
// -------------------------------------------------------------------------
const faltando = [...new Set(cards.filter((c) => !c.namePt).map((c) => c.name))];
console.log(`\nPassada 2: ${faltando.length} nomes distintos sem PT no proprio set.`);

const porNome = new Map(); // nome EN -> printed_name
n = 0;
for (const nome of faltando) {
  n += 1;
  const achados = await busca(`!"${nome.replace(/"/g, '\\"')}" lang:pt`);
  const pt = achados.find((c) => c.printed_name)?.printed_name;
  if (pt) porNome.set(nome, pt);
  if (n % 50 === 0 || n === faltando.length) {
    console.log(`  ${String(n).padStart(4)}/${faltando.length} nomes — ${porNome.size} achados`);
  }
}

let porOutroSet = 0;
for (const c of cards) {
  if (c.namePt) continue;
  const pt = porNome.get(c.name);
  if (pt) {
    c.namePt = pt;
    porOutroSet += 1;
  }
}

// `namePt` identico ao ingles nao carrega informacao e so engorda o JSON e o
// HTML: a UI ja cai no `name` quando o campo falta.
let iguais = 0;
for (const c of cards) {
  if (c.namePt === c.name) {
    delete c.namePt;
    iguais += 1;
  }
}

const com = cards.filter((c) => c.namePt).length;
await writeFile(CYCLES, JSON.stringify(cycles, null, 2), "utf8");
console.log(`\nPronto: ${cycles.length} ciclos -> ${CYCLES}`);
console.log(`  namePt pelo proprio set:   ${porSet}`);
console.log(`  namePt por outra impressao: ${porOutroSet}`);
console.log(`  descartados (PT === EN):    ${iguais}`);
console.log(`  cartas com namePt:          ${com} de ${cards.length}`);
console.log(`  sem PT (cai no ingles):     ${cards.length - com}`);

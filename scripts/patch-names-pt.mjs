// -------------------------------------------------------------------------
// Preenche `namePt` e `typeLinePt` nas cartas do cycles.generated.json, NO LUGAR.
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
// Os dois campos vem da MESMA resposta (`printed_name` e `printed_type_line`),
// entao coletar o tipo nao custa request nenhum a mais.
//
// O que fica sem PT e o que nunca foi impresso em portugues. Medido em
// 2026-09-08: 1996-2022 fica entre 80% e 100%, e a cobertura desaba no fim —
// 2023: 58%, 2024: 28%, 2025: 3%, 2026: 2%. A UI cai no ingles.
// -------------------------------------------------------------------------
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const UA = "mtg-cycles/1.0";
const HERE = dirname(fileURLToPath(import.meta.url));
const CYCLES = join(HERE, "cycles.generated.json");

// A Scryfall pede 50-100ms entre requests, mas isso e o piso, nao a garantia:
// rodar o script duas vezes seguidas levou 429 no 8o set mesmo a 100ms. O que
// resolve nao e a pausa, e a espera DEPOIS do 429 — por isso o backoff abaixo
// dobra e vai ate ~32s, em vez dos 3s que falharam.
const PAUSA = 150;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function scryfall(url) {
  for (let tentativa = 1; tentativa <= 6; tentativa++) {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    // 404 = a busca nao achou nada. E resposta, nao falha: quer dizer que essa
    // carta/set nao existe em portugues.
    if (res.status === 404) return null;
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      // Retry-After quando o servidor manda; senao 2s, 4s, 8s, 16s, 32s.
      const header = Number(res.headers.get("retry-after"));
      const ms = header > 0 ? header * 1000 : 1000 * 2 ** tentativa;
      console.log(`   ${res.status} — esperando ${Math.round(ms / 1000)}s`);
      await espera(ms);
      continue;
    }
    throw new Error(`${res.status} em ${url}`);
  }
  throw new Error(`${url}: 429 mesmo apos 6 tentativas — pare e tente mais tarde`);
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

// Carta de mais de uma face (transformar, Aventura, dividida, Sala) NAO tem
// `printed_name` nem `printed_type_line` no topo: os dois moram em
// `card_faces[i]`. Ler so o topo deixou as 245 cartas multi-face do catalogo
// sem PT, inclusive as 131 de sets que sairam em portugues — medido em
// 2026-09-11. Junta as faces com " // ", o separador que o `name` e o
// `typeLine` em ingles ja usam.
function impresso(c) {
  if (c.printed_name) {
    return { nome: c.printed_name, tipo: c.printed_type_line ?? null };
  }
  const faces = c.card_faces ?? [];
  if (faces.length === 0 || !faces.every((f) => f.printed_name)) return null;
  const tipos = faces.map((f) => f.printed_type_line);
  return {
    nome: faces.map((f) => f.printed_name).join(" // "),
    tipo: tipos.every(Boolean) ? tipos.join(" // ") : null,
  };
}

const cycles = JSON.parse(await readFile(CYCLES, "utf8"));
const cards = cycles.flatMap((cy) => cy.cards).filter((c) => !c.missing);

// -------------------------------------------------------------------------
// Passada 1 — por set
// -------------------------------------------------------------------------
const sets = [...new Set(cards.map((c) => c.set).filter(Boolean))].sort();
console.log(`Passada 1: ${sets.length} sets, ${cards.length} cartas.`);

const porNumero = new Map(); // "set/numero" -> { nome, tipo }
let n = 0;
for (const set of sets) {
  n += 1;
  const achados = await busca(`set:${set} lang:pt`);
  for (const c of achados) {
    const pt = impresso(c);
    if (pt) porNumero.set(`${c.set}/${c.collector_number}`, pt);
  }
  if (n % 25 === 0 || n === sets.length) {
    console.log(`  ${String(n).padStart(3)}/${sets.length} sets — ${porNumero.size} impressoes PT`);
  }
}

let porSet = 0;
for (const c of cards) {
  const pt = porNumero.get(`${c.set}/${c.collectorNumber}`);
  if (pt) {
    c.namePt = pt.nome;
    if (pt.tipo) c.typeLinePt = pt.tipo;
    porSet += 1;
  }
}

// -------------------------------------------------------------------------
// Passada 2 — o que sobrou, por nome exato
// -------------------------------------------------------------------------
// Inclui quem ja tem `namePt` mas nao tem `typeLinePt`: sao as cartas que a
// rodada anterior achou por nome, e cujo tipo ficou de fora daquela passada.
const faltando = [
  ...new Set(cards.filter((c) => !c.namePt || !c.typeLinePt).map((c) => c.name)),
];
console.log(`\nPassada 2: ${faltando.length} nomes distintos sem PT no proprio set.`);

const porNome = new Map(); // nome EN -> { nome, tipo }
n = 0;
for (const nome of faltando) {
  n += 1;
  const achados = await busca(`!"${nome.replace(/"/g, '\\"')}" lang:pt`);
  // O tipo pode divergir entre impressoes (errata de tipo, "Summon" virando
  // "Creature"), mas a busca devolve a mais recente primeiro — e e o que a arte
  // exibida ao lado tambem mostra.
  const pt = achados.map(impresso).find(Boolean);
  if (pt) porNome.set(nome, pt);
  if (n % 50 === 0 || n === faltando.length) {
    console.log(`  ${String(n).padStart(4)}/${faltando.length} nomes — ${porNome.size} achados`);
  }
}

let porOutroSet = 0;
for (const c of cards) {
  if (c.namePt && c.typeLinePt) continue;
  const pt = porNome.get(c.name);
  if (!pt) continue;
  if (!c.namePt) {
    c.namePt = pt.nome;
    porOutroSet += 1;
  }
  if (!c.typeLinePt && pt.tipo) c.typeLinePt = pt.tipo;
}

// `namePt` identico ao ingles nao carrega informacao e so engorda o JSON e o
// HTML: a UI ja cai no `name` quando o campo falta.
let iguais = 0;
let tiposIguais = 0;
for (const c of cards) {
  if (c.namePt === c.name) {
    delete c.namePt;
    iguais += 1;
  }
  if (c.typeLinePt === c.typeLine) {
    delete c.typeLinePt;
    tiposIguais += 1;
  }
}

const com = cards.filter((c) => c.namePt).length;
const comTipo = cards.filter((c) => c.typeLinePt).length;
await writeFile(CYCLES, JSON.stringify(cycles, null, 2), "utf8");
console.log(`\nPronto: ${cycles.length} ciclos -> ${CYCLES}`);
console.log(`  namePt pelo proprio set:   ${porSet}`);
console.log(`  namePt por outra impressao: ${porOutroSet}`);
console.log(`  descartados (PT === EN):    ${iguais} nomes, ${tiposIguais} tipos`);
console.log(`  cartas com namePt:          ${com} de ${cards.length}`);
console.log(`  cartas com typeLinePt:      ${comTipo} de ${cards.length}`);
console.log(`  sem PT (cai no ingles):     ${cards.length - com}`);

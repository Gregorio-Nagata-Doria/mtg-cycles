// -------------------------------------------------------------------------
// Compoe `typeLinePt` a partir de um DICIONARIO de tipos, em vez de pedir a
// linha pronta carta a carta. Roda offline: `node scripts/build-type-lines.mjs`
//
// Por que existe: linha de tipo nao e texto livre. E `[supertipos] Tipo — [subtipos]`
// sobre um vocabulario fechado de algumas centenas de palavras. Pedir a linha
// inteira por carta e pagar 4755 requests para reaprender as mesmas 200 palavras.
//
// O dicionario vem das cartas que JA tem par EN/PT (`patch-names-pt.mjs` as
// trouxe). Com ele da para compor a linha de cartas que nunca sairam em
// portugues — inclusive os sets de 2023+, onde a impressao PT nao existe.
//
// Escreve `scripts/types.lexicon.json` para revisao a mao. O arquivo e a fonte
// da verdade da proxima rodada: entrada escrita por gente ganha da aprendida.
//
// Com `--buscar`, o que sobrou vai a Scryfall — mas por TERMO, nao por carta:
// uma consulta `lang:pt t:werewolf` resolve "Werewolf" para as 10 cartas que o
// usam. Sao dezenas de requests contra milhares, e o resultado entra no
// dicionario, entao a proxima rodada nao precisa da rede.
// -------------------------------------------------------------------------
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CYCLES = join(HERE, "cycles.generated.json");
const DICT = join(HERE, "types.lexicon.json");

// Impressao antiga usa " - " onde a nova usa " — ", e as vezes empurra o
// subtipo para o lado esquerdo. Sem normalizar, "Criatura - Espirito" vira uma
// traducao concorrente de "Creature" e polui o dicionario.
const norm = (s) => s.replace(/\s+[-–—]\s+/g, " — ").trim();

const cycles = JSON.parse(await readFile(CYCLES, "utf8"));
const cards = cycles.flatMap((cy) => cy.cards).filter((c) => c.typeLine);

// Carta de duas faces tem "A // B": cada lado e uma linha de tipo inteira e
// aprende sozinho.
const faces = (linha) => linha.split(" // ");
const partes = (linha) => {
  const [esq, dir] = linha.split(" — ");
  return { esq: esq.trim(), subs: dir ? dir.trim().split(/\s+/) : [] };
};

// -------------------------------------------------------------------------
// 1. Aprender
// -------------------------------------------------------------------------
const anterior = JSON.parse(await readFile(DICT, "utf8").catch(() => "{}"));
const esquerda = new Map(Object.entries(anterior.esquerda ?? {}));
const subtipos = new Map(Object.entries(anterior.subtipos ?? {}));
const manual = new Set([
  ...Object.keys(anterior.esquerda ?? {}),
  ...Object.keys(anterior.subtipos ?? {}),
]);

// Por data crescente: a impressao mais recente sobrescreve a antiga. E o que
// resolve "Planinauta" (Lorwyn) contra "Planeswalker" (hoje) sem escolher a mao.
const pares = cards
  .filter((c) => c.typeLinePt)
  .sort((a, b) => (a.releasedAt ?? "").localeCompare(b.releasedAt ?? ""));

let desalinhados = 0;
function aprende(typeLine, typeLinePt) {
  const en = faces(norm(typeLine));
  const pt = faces(norm(typeLinePt));
  if (en.length !== pt.length) return;

  for (let i = 0; i < en.length; i++) {
    const a = partes(en[i]);
    const b = partes(pt[i]);
    if (a.esq && b.esq && !manual.has(a.esq)) esquerda.set(a.esq, b.esq);
    // Subtipo casa por posicao — a ordem e a mesma nos dois idiomas. Contagem
    // diferente quer dizer que a impressao PT nao lista os mesmos subtipos, e
    // aprender dali inventaria par errado.
    if (a.subs.length !== b.subs.length) {
      desalinhados += 1;
      continue;
    }
    a.subs.forEach((t, j) => {
      if (!manual.has(t)) subtipos.set(t, b.subs[j]);
    });
  }
}
for (const c of pares) aprende(c.typeLine, c.typeLinePt);

// -------------------------------------------------------------------------
// 2. Compor o que falta
// -------------------------------------------------------------------------
const faltando = [];
function compoe(linha) {
  const out = [];
  for (const face of faces(norm(linha))) {
    const { esq, subs } = partes(face);
    const pEsq = esquerda.get(esq);
    if (!pEsq) {
      faltando.push(esq);
      return null;
    }
    const pSubs = [];
    for (const t of subs) {
      const p = subtipos.get(t);
      if (!p) {
        faltando.push(t);
        return null;
      }
      pSubs.push(p);
    }
    out.push(pSubs.length ? `${pEsq} — ${pSubs.join(" ")}` : pEsq);
  }
  return out.join(" // ");
}

function compoeTudo() {
  faltando.length = 0;
  let feitas = 0;
  let sem = 0;
  for (const c of cards) {
    if (c.typeLinePt) continue;
    const pt = compoe(c.typeLine);
    // Igual ao ingles nao carrega informacao: a UI ja cai no `typeLine`.
    if (pt && pt !== c.typeLine) {
      c.typeLinePt = pt;
      feitas += 1;
    } else {
      sem += 1;
    }
  }
  return { feitas, sem };
}

let { feitas: compostas, sem: semPeca } = compoeTudo();

// -------------------------------------------------------------------------
// 2b. `--buscar`: uma consulta por TERMO que faltou
// -------------------------------------------------------------------------
let buscados = 0;
if (process.argv.includes("--buscar")) {
  const termos = [...new Set(faltando)];
  console.log(`--buscar: ${termos.length} termos sem traducao no dicionario.`);
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const termo of termos) {
    // `t:` casa supertipo, tipo e subtipo — serve para "Werewolf" e para
    // "Legendary Land" igual. Mais recente primeiro: e a grafia de hoje.
    const q =
      termo
        .split(/\s+/)
        .map((w) => `t:"${w}"`)
        .join(" ") + " lang:pt";
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=released&dir=desc`;
    let json = null;
    for (let tentativa = 1; tentativa <= 5; tentativa++) {
      const res = await fetch(url, {
        headers: { "User-Agent": "mtg-cycles/1.0", Accept: "application/json" },
      });
      if (res.status === 404) break;
      if (res.ok) {
        json = await res.json();
        break;
      }
      if (res.status === 429 || res.status >= 500) {
        const header = Number(res.headers.get("retry-after"));
        await espera(header > 0 ? header * 1000 : 1000 * 2 ** tentativa);
        continue;
      }
      break;
    }
    await espera(150);
    if (!json) continue;
    for (const c of json.data.slice(0, 8)) {
      if (c.type_line && c.printed_type_line) aprende(c.type_line, c.printed_type_line);
    }
    if (esquerda.has(termo) || subtipos.has(termo)) buscados += 1;
  }

  const dnv = compoeTudo();
  compostas += dnv.feitas;
  semPeca = dnv.sem;
  console.log(`  termos resolvidos: ${buscados} de ${termos.length}`);
}

// -------------------------------------------------------------------------
// 3. Gravar
// -------------------------------------------------------------------------
const ordena = (m) =>
  Object.fromEntries([...m].sort(([a], [b]) => a.localeCompare(b)));
const buraco = {};
for (const t of faltando) buraco[t] = (buraco[t] ?? 0) + 1;

await writeFile(
  DICT,
  JSON.stringify(
    {
      _meta: {
        purpose:
          "EN->PT da linha de tipo. `esquerda` e o bloco antes do travessao (supertipo+tipo, que em PT troca de ordem e por isso e aprendido inteiro); `subtipos` casa palavra a palavra depois do travessao.",
        policy:
          "Aprendido de printed_type_line das impressoes PT, impressao mais recente ganhando. Entrada editada a mao NAO e sobrescrita na proxima rodada — o script preserva o que ja esta neste arquivo.",
        pendente:
          "`_faltando` lista o que apareceu numa carta e nao esta no dicionario. Traduzir ali e a unica forma de cobrir os sets que nunca sairam em portugues.",
      },
      esquerda: ordena(esquerda),
      subtipos: ordena(subtipos),
      _faltando: Object.fromEntries(
        Object.entries(buraco).sort((a, b) => b[1] - a[1]),
      ),
    },
    null,
    2,
  ),
  "utf8",
);
await writeFile(CYCLES, JSON.stringify(cycles, null, 2), "utf8");

const com = cards.filter((c) => c.typeLinePt).length;
console.log(`Dicionario -> ${DICT}`);
console.log(`  lados esquerdos:      ${esquerda.size}`);
console.log(`  subtipos:             ${subtipos.size}`);
console.log(`  pares descartados:    ${desalinhados} (contagem de subtipo divergente)`);
console.log(`\nCiclos -> ${CYCLES}`);
console.log(`  typeLinePt composto:  ${compostas}`);
console.log(`  termos vindos da rede: ${buscados}`);
console.log(`  ainda sem peca:       ${semPeca}`);
console.log(`  total com typeLinePt: ${com} de ${cards.length}`);
console.log(`  vocabulario faltando: ${Object.keys(buraco).length} termos`);

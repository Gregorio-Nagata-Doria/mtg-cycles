// build-symbols.mjs
// -------------------------------------------------------------------------
// Roda 1x na sua maquina: `node scripts/build-symbols.mjs`
// Congela os SVGs de simbolo de set num JSON, pra o site nao pedir um por
// ciclo renderizado (era um N+1: ~9 requisicoes por visita ao catalogo).
//
// Le scripts/cycles.generated.json -> roda DEPOIS de build-cycles.mjs.
// Grava scripts/set-symbols.generated.json no formato { "dmr": "<svg .../>" }.
//
// A chave e o nome do arquivo na URL do Scryfall, NAO o setCode do ciclo:
// em 20 ciclos os dois divergem (cycle-1mv-tutor tem setCode "1mv" e simbolo
// "dmr.svg", porque o setCode sai do slug do Tagger e o simbolo sai da
// impressao real).
//
// So usa APIs nativas do Node 22. Zero dependencias.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const UA = "mtg-cycles/1.0";
const HERE = dirname(fileURLToPath(import.meta.url));
const IN = join(HERE, "cycles.generated.json");
const OUT = join(HERE, "set-symbols.generated.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const symbolKey = (url) => url.split("?")[0].split("/").pop().replace(/\.svg$/, "");

async function main() {
  const cycles = JSON.parse(await readFile(IN, "utf8"));

  const byKey = new Map();
  for (const cycle of cycles) {
    if (!cycle.setSymbol) continue;
    const key = symbolKey(cycle.setSymbol);
    if (!byKey.has(key)) byKey.set(key, cycle.setSymbol.split("?")[0]);
  }

  const keys = [...byKey.keys()].sort();
  console.log(`${cycles.length} ciclos -> ${keys.length} simbolos distintos`);

  const symbols = {};
  const failed = [];

  for (const [i, key] of keys.entries()) {
    const url = byKey.get(key);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "image/svg+xml" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svg = (await res.text()).trim();
      if (!svg.startsWith("<svg")) throw new Error("resposta nao e SVG");
      symbols[key] = svg;
    } catch (err) {
      failed.push(`${key}: ${err.message}`);
    }
    if ((i + 1) % 25 === 0 || i + 1 === keys.length) {
      console.log(`  ${i + 1}/${keys.length}`);
    }
    await sleep(100);
  }

  await writeFile(OUT, JSON.stringify(symbols, null, 2) + "\n");

  const bytes = Object.values(symbols).reduce((n, s) => n + s.length, 0);
  console.log(`gravado ${OUT}`);
  console.log(`${Object.keys(symbols).length} simbolos, ${(bytes / 1024).toFixed(0)} KB de SVG`);
  if (failed.length) console.log(`falharam ${failed.length}:\n  ${failed.join("\n  ")}`);
}

main();

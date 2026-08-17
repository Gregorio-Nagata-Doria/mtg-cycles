import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CYCLES = join(HERE, "cycles.generated.json");
const LEXICON = join(HERE, "cycles.lexicon.json");

const cycles = JSON.parse(await readFile(CYCLES, "utf8"));
const lex = JSON.parse(await readFile(LEXICON, "utf8"));

const bases = new Set(Object.keys(lex).filter((k) => !k.startsWith("_")));
const quals = lex._qualifiers;
const qualKeys = new Set(Object.keys(quals));
const structural = lex._structural;

const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
const titleCase = (s) => s.split("-").map(cap).join(" ");

function themeOf({ slug, setCode }) {
  const pfx = setCode ? `cycle-${setCode}-` : "cycle-";
  return slug.startsWith(pfx) ? slug.slice(pfx.length) : slug.replace(/^cycle-/, "");
}

function parse(theme) {
  const T = theme.split("-");
  const seg = [];
  const unknown = [];
  let i = 0;
  outer: while (i < T.length) {
    for (let L = Math.min(4, T.length - i); L >= 1; L--) {
      const cand = T.slice(i, i + L).join("-");
      if (bases.has(cand)) { seg.push({ k: cand, kind: "base" }); i += L; continue outer; }
      if (qualKeys.has(cand)) { seg.push({ k: cand, kind: "qual" }); i += L; continue outer; }
    }
    unknown.push(T[i]);
    i += 1;
  }
  return { seg, unknown };
}

// Concordância: em PT o qualificador é adjetivo e flexiona com o núcleo.
// `pt` string  = forma invariável ("de duas cores");
// `pt` objeto  = { ms, fs, mp, fp } — masculino/feminino x singular/plural.
function qualPt(q, gender, plural) {
  if (typeof q.pt === "string") return q.pt;
  return q.pt[(gender === "f" ? "f" : "m") + (plural ? "p" : "s")];
}

function nameFor(theme) {
  if (bases.has(theme)) {
    const e = lex[theme];
    return e.review ? { en: e.en, pt: e.pt, ptReview: true } : { en: e.en, pt: e.pt };
  }

  const { seg, unknown } = parse(theme);

  if (unknown.length) {
    const en = titleCase(theme);
    return { en, pt: en, ptReview: true };
  }

  const baseSegs = seg.filter((s) => s.kind === "base");
  const qualSegs = seg.filter((s) => s.kind === "qual");

  // O núcleo manda no gênero e no número. Sem base, o núcleo é "Ciclo" (m., sing.).
  const gender = baseSegs.length ? (lex[baseSegs[0].k].g ?? "m") : "m";
  const plural = baseSegs.length > 0;

  // PT lê melhor com o adjetivo classificador antes do de raridade:
  // "Lendas monocolores raras", não "Lendas raras monocolores".
  // Duas raridades no mesmo ciclo viram "raras e míticas".
  // "de cores inimigas à frente no ciclo de cores", nunca "à frente no ciclo de
  // cores de cores inimigas": o adjetivo de cor gruda no núcleo, a posição vem depois.
  const rarity = qualSegs.filter((s) => quals[s.k].kind === "rarity");
  const position = qualSegs.filter((s) => quals[s.k].kind === "position");
  const other = qualSegs.filter((s) => !["rarity", "position"].includes(quals[s.k].kind));
  const qPt = [
    ...[...other, ...position].map((s) => qualPt(quals[s.k], gender, plural)),
    ...(rarity.length ? [rarity.map((s) => qualPt(quals[s.k], gender, plural)).join(" e ")] : []),
  ];

  // Ordem do EN é a do slug — o inglês da comunidade já vem nessa ordem.
  const qEn = qualSegs.map((s) => quals[s.k].en);

  // Duas bases justapostas nunca soam bem em PT ("Cartas de tipo Equipamentos"):
  // o tema merece uma entrada composta própria no léxico.
  const review =
    baseSegs.length > 1 ||
    baseSegs.some((s) => lex[s.k].review) ||
    qualSegs.some((s) => quals[s.k].review);

  const out = baseSegs.length === 0
    ? { en: [...qEn, structural.en].join(" "), pt: [structural.pt, ...qPt].join(" ") }
    : {
        en: [...qEn, baseSegs.map((s) => lex[s.k].en).join(" ")].join(" "),
        pt: [baseSegs.map((s) => lex[s.k].pt).join(" "), ...qPt].join(" "),
      };
  if (review) out.ptReview = true;
  return out;
}

const stats = { curado: 0, review: 0 };
for (const cy of cycles) {
  cy.name = nameFor(themeOf(cy));
  if (cy.name.ptReview) stats.review += 1;
  else stats.curado += 1;
}

await writeFile(CYCLES, JSON.stringify(cycles, null, 2), "utf8");
console.log(`Pronto: name gravado em ${cycles.length} ciclos -> ${CYCLES}`);
console.log(`  pt confiavel (curado/structural): ${stats.curado}`);
console.log(`  pt a revisar (ptReview):          ${stats.review}`);

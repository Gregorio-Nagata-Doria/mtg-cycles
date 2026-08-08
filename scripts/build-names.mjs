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

function nameFor(theme) {
  if (bases.has(theme)) {
    const e = lex[theme];
    return { en: e.en, pt: e.pt };
  }

  const { seg, unknown } = parse(theme);
  const baseSegs = seg.filter((s) => s.kind === "base");
  const qualSegs = seg.filter((s) => s.kind === "qual");

  if (unknown.length) {
    const en = titleCase(theme);
    return { en, pt: en, ptReview: true };
  }

  const qEn = qualSegs.map((s) => quals[s.k].en);
  const qPt = qualSegs.map((s) => quals[s.k].pt);

  if (baseSegs.length === 0) {
    return {
      en: [...qEn, structural.en].join(" "),
      pt: [structural.pt, ...qPt].join(" "),
    };
  }

  const bEn = baseSegs.map((s) => lex[s.k].en).join(" ");
  const bPt = baseSegs.map((s) => lex[s.k].pt).join(" ");
  return {
    en: [...qEn, bEn].join(" "),
    pt: [bPt, ...qPt].join(" "),
    ptReview: true,
  };
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

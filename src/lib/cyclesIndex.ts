// Índice enxuto do catálogo: o que o navegador precisa para buscar, filtrar e
// ordenar os 951 ciclos sem baixar `cycles.generated.json`.
//
// ⚠️ Este módulo é importado por componente cliente. Ele NÃO pode importar
// `@cycles` — o JSON tem 3,1 MB e iria inteiro para o bundle do navegador (foi
// exatamente assim que o SearchList.tsx morreu, commit e964869). Quem lê o JSON
// e monta o payload é `buildCycleIndex()` em `cycles.ts`, no servidor; aqui só
// existe o formato de arame e as funções puras que operam sobre ele.
//
// ⚠️ E o leque de miniaturas do <CyclePreview>? Fica de fora, e isso é medido:
// com os 5 `scryfallId` por ciclo (a codificação mais compacta possível — a URL
// é reconstruível a partir do id) o índice sai de 14,2 KB para 96,2 KB brotli;
// com as URLs `small` completas mais o nome da carta, 165,9 KB. São 6× a 12× o
// índice inteiro, dentro do HTML, para alimentar imagem que a vitrine estática
// já entrega. Por isso o resultado filtrado usa um cartão de texto.

import type { Query, SortKey } from "./filters";

// Formato de arame: tupla posicional e tabela de sets à parte. Contra o mesmo
// índice em objetos com chave, economiza ~1,6 KB brotli (14,2 contra 15,8) —
// o `decode` abaixo devolve objetos nomeados, então a economia não custa
// legibilidade em quem consome.
export type CycleRow = [
  slug: string, // sem o prefixo "cycle-", que é constante nos 951
  pt: string,
  en: string | 0, // 0 = igual ao pt (517 dos 951 casos)
  set: number, // índice em `sets`; -1 quando o ciclo não tem set
  year: number, // 0 quando o ciclo não tem ano (os mesmos 10 sem set)
  rarity: string,
  structure: string, // "" quando o ciclo não cai em nenhuma das 6 estruturas
  colors: string, // união WUBRG das cartas; "" = incolor
];

export type CycleIndex = {
  sets: [code: string, name: string][];
  rows: CycleRow[];
};

export type IndexedCycle = {
  slug: string;
  pt: string;
  en: string;
  setCode: string | null;
  setName: string | null;
  year: number | null;
  rarity: string | null;
  structure: string | null;
  colors: string;
  // Texto já dobrado para a busca. Não viaja na URL nem no payload: é montado
  // no decode, uma vez, e evita normalizar 951 nomes a cada tecla.
  haystack: string;
};

// Faixa dos diacríticos combinantes (U+0300–U+036F), que é o que o NFD separa
// da letra. Montada por fromCharCode para o fonte não carregar combinante solto.
const DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  "g",
);

// Tira acento e caixa. Os nomes PT têm acento e quem digita quase nunca põe:
// "Guardiões" tem que ser achável por "guardioes".
export function fold(text: string): string {
  return text.normalize("NFD").replace(DIACRITICS, "").toLowerCase();
}

export function decodeIndex(index: CycleIndex): IndexedCycle[] {
  return index.rows.map(([slug, pt, en, set, year, rarity, structure, colors]) => {
    const setEntry = set >= 0 ? index.sets[set] : undefined;
    const name = { pt, en: en === 0 ? pt : en };
    return {
      slug: `cycle-${slug}`,
      pt: name.pt,
      en: name.en,
      setCode: setEntry?.[0] ?? null,
      setName: setEntry?.[1] ?? null,
      year: year === 0 ? null : year,
      rarity: rarity || null,
      structure: structure || null,
      colors,
      haystack: fold(`${name.pt} ${name.en} ${setEntry?.[1] ?? ""}`),
    };
  });
}

function matchesSelected(entry: IndexedCycle, query: Query): boolean {
  const { selected } = query;

  if (selected.set.length && !selected.set.includes(entry.setCode ?? ""))
    return false;
  if (selected.rarity.length && (!entry.rarity || !selected.rarity.includes(entry.rarity)))
    return false;
  if (
    selected.structure.length &&
    (!entry.structure || !selected.structure.includes(entry.structure))
  )
    return false;
  if (
    selected.year.length &&
    (entry.year === null || !selected.year.includes(String(entry.year)))
  )
    return false;
  if (
    selected.color.length &&
    !selected.color.some((color) =>
      color === "c" ? entry.colors === "" : entry.colors.includes(color.toUpperCase()),
    )
  )
    return false;

  return true;
}

// Todos os termos precisam aparecer, em qualquer ordem: "leyline gua" acha
// "Leylines de Guarda". Substring e não prefixo — os nomes são curtos e o
// usuário lembra do meio ("tutor", "espada").
function matchesText(entry: IndexedCycle, terms: string[]): boolean {
  return terms.every((term) => entry.haystack.includes(term));
}

// Comparação sobre o texto já dobrado, com `<`, e não com localeCompare: o
// mesmo array é ordenado no prerender (Node) e no navegador, e comparador
// dependente de ICU pode divergir entre os dois.
function byName(a: IndexedCycle, b: IndexedCycle): number {
  const left = fold(a.pt);
  const right = fold(b.pt);
  if (left !== right) return left < right ? -1 : 1;
  return a.slug < b.slug ? -1 : 1;
}

// Ciclo sem ano vai sempre para o fim, nas duas direções: são os 10 que não
// têm set, e inventar um ano para ordenar seria inventar dado.
function byYear(a: IndexedCycle, b: IndexedCycle, desc: boolean): number {
  if (a.year === null || b.year === null) {
    if (a.year === b.year) return byName(a, b);
    return a.year === null ? 1 : -1;
  }
  if (a.year !== b.year) return desc ? b.year - a.year : a.year - b.year;
  return byName(a, b);
}

function sortEntries(entries: IndexedCycle[], sort: SortKey): IndexedCycle[] {
  switch (sort) {
    case "name-asc":
      return entries.sort(byName);
    case "name-desc":
      return entries.sort((a, b) => byName(b, a));
    case "year-asc":
      return entries.sort((a, b) => byYear(a, b, false));
    case "year-desc":
      return entries.sort((a, b) => byYear(a, b, true));
    default:
      return entries; // ordem do catálogo, que é a ordem do JSON
  }
}

export function applyQuery(entries: IndexedCycle[], query: Query): IndexedCycle[] {
  const terms = fold(query.q).split(/\s+/).filter(Boolean);
  const filtered = entries.filter(
    (entry) => matchesSelected(entry, query) && matchesText(entry, terms),
  );
  // `filtered` já é array novo — ordenar no lugar não mexe no índice decodado.
  return sortEntries(filtered, query.sort);
}

// Índice enxuto do catálogo: o que o navegador precisa para buscar, filtrar e
// ordenar os 951 ciclos sem baixar `cycles.generated.json`.
//
// ⚠️ Este módulo é importado por componente cliente. Ele NÃO pode importar
// `@cycles` — o JSON tem 3,1 MB e iria inteiro para o bundle do navegador (foi
// exatamente assim que o SearchList.tsx morreu, commit e964869). Quem lê o JSON
// e monta o payload é `buildCycleIndex()` em `cycles.ts`, no servidor; aqui só
// existe o formato de arame e as funções puras que operam sobre ele.
//
// ⚠️ O leque de miniaturas custa caro e entra assim mesmo, por decisão de
// 2026-08-16: sem ele só a primeira página tinha imagem, e as outras 39 — mais
// toda lista de busca — viravam cartão de texto. Duas telas diferentes para a
// mesma coisa.
//
// O preço, medido sobre os 951 ciclos: os 5 `scryfallId` levam o índice de
// 14,0 para 101,6 KB brotli (+87,6). São UUIDs, entropia pura: não comprimem, e
// esse é o piso, não uma codificação ruim. Uma miniatura só por ciclo custaria
// +19,4 KB, mas criaria um terceiro desenho de card. A comparação que decidiu:
// a página já baixa 120 imagens de carta da CDN da Scryfall, ao lado das quais
// 87,6 KB de id é troco.
//
// A URL sai do id por substituição pura, sem tabela — verificado nas 4.755
// cartas, zero divergência. O `?timestamp` do JSON é cache-bust e a CDN serve
// sem ele (200 image/jpeg), então não viaja.

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
  thumbs: string, // os 5 scryfallId concatenados, 36 chars cada, sem separador
];

// Os ids vêm colados para não pagar 4 separadores por ciclo. Todo ciclo tem
// exatamente 5 cartas (medido: 951 de 951), então fatiar por posição fixa é
// seguro — mas o slice tolera um ciclo menor sem estourar, caso o escopo mude.
const ID_LEN = 36;

export function thumbIds(packed: string): string[] {
  const ids: string[] = [];
  for (let i = 0; i + ID_LEN <= packed.length; i += ID_LEN) {
    ids.push(packed.slice(i, i + ID_LEN));
  }
  return ids;
}

// Espelha cardThumb() de cycles.ts, mas partindo do id em vez da URL cheia: o
// cliente não tem a URL. Os dois caem no mesmo arquivo da CDN.
export function thumbUrl(id: string): string {
  return `https://cards.scryfall.io/small/front/${id[0]}/${id[1]}/${id}.jpg`;
}

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
  // URLs prontas das 5 miniaturas, na ordem do ciclo.
  thumbs: string[];
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
  return index.rows.map(([slug, pt, en, set, year, rarity, structure, colors, thumbs]) => {
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
      thumbs: thumbIds(thumbs).map(thumbUrl),
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

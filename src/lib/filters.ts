// Plumbing do filtro por URL. Este módulo é importado pelo cliente — não pode
// importar `@cycles` (3,1 MB) nem nada que importe, direta ou transitivamente.
export const FILTER_GROUPS = [
  "set",
  "rarity",
  "structure",
  "year",
  "color",
] as const;

export type FilterGroup = (typeof FILTER_GROUPS)[number];
export type Selected = Record<FilterGroup, string[]>;

export const EMPTY_SELECTED: Selected = {
  set: [],
  rarity: [],
  structure: [],
  year: [],
  color: [],
};

// Densidade da lista. Duas, nomeadas, escolhidas por quem lê — é o que a
// Scryfall faz com display:grid/text e o que resolve a divergência do #19:
// dois desenhos deixam de ser incoerência quando são uma escolha explícita.
//
// "gallery" é o padrão e não viaja na URL porque é o que o HTML estático já
// entrega. O índice só existe depois que o JS assume — ver isDefaultQuery().
export const DENSITIES = [
  { value: "gallery", label: { pt: "Galeria", en: "Gallery" } },
  { value: "index", label: { pt: "Índice", en: "Index" } },
] as const;

export type DensityKey = (typeof DENSITIES)[number]["value"];

const DENSITY_VALUES: readonly string[] = DENSITIES.map((d) => d.value);

// O teto de cada modo é a conta de imagens, não o gosto: o card traz um leque
// de 5 miniaturas, então 24 cards são 120 requisições à CDN da Scryfall. A
// linha do índice não tem imagem nenhuma — é isso que deixa 100 caber.
export const PER_PAGE = 24;
export const PER_PAGE_INDEX = 100;

export function perPage(density: DensityKey): number {
  return density === "index" ? PER_PAGE_INDEX : PER_PAGE;
}

// Rótulo é par {pt,en} para ser passado direto ao <T> com spread. O `value`
// continua sendo a chave em inglês que vai para a URL — o idioma da interface
// não pode mudar o link do filtro.
export type Label = { pt: string; en: string };

export const RARITIES: { value: string; label: Label }[] = [
  { value: "common", label: { pt: "Comum", en: "Common" } },
  { value: "uncommon", label: { pt: "Incomum", en: "Uncommon" } },
  { value: "rare", label: { pt: "Rara", en: "Rare" } },
  { value: "mythic", label: { pt: "Mítica", en: "Mythic" } },
];

// Derivado de RARITIES para que rótulo do filtro e rótulo exibido não possam
// divergir.
export const RARITY_LABELS: Record<string, Label> = Object.fromEntries(
  RARITIES.map((rarity) => [rarity.value, rarity.label]),
);

export const STRUCTURES: { value: string; label: Label }[] = [
  { value: "5-mono", label: { pt: "5 monocolores (WUBRG)", en: "5 mono-colored (WUBRG)" } },
  { value: "10-duplas", label: { pt: "10 duplas", en: "10 pairs" } },
  { value: "5-aliadas", label: { pt: "5 duplas aliadas", en: "5 allied pairs" } },
  { value: "5-inimigas", label: { pt: "5 duplas inimigas", en: "5 enemy pairs" } },
  { value: "artefatos", label: { pt: "Artefatos", en: "Artifacts" } },
  { value: "terras", label: { pt: "Terrenos", en: "Lands" } },
];

export const STRUCTURE_LABELS: Record<string, Label> = Object.fromEntries(
  STRUCTURES.map((structure) => [structure.value, structure.label]),
);

// Cor do ciclo é a união das cores das cartas (ver cycleColors em cycles.ts).
// "c" não é letra de cor: é o caso incolor, o ciclo em que nenhuma carta tem
// cor — artefato ou terreno.
export const COLORS: { value: string; label: Label }[] = [
  { value: "w", label: { pt: "Branco", en: "White" } },
  { value: "u", label: { pt: "Azul", en: "Blue" } },
  { value: "b", label: { pt: "Preto", en: "Black" } },
  { value: "r", label: { pt: "Vermelho", en: "Red" } },
  { value: "g", label: { pt: "Verde", en: "Green" } },
  { value: "c", label: { pt: "Incolor", en: "Colorless" } },
];

// "" é a ordem do catálogo (a ordem do JSON) e é o padrão: é ela que o HTML
// estático mostra, então ela não pode sair da URL.
export const SORTS = [
  { value: "", label: { pt: "catálogo", en: "catalog" } },
  { value: "name-asc", label: { pt: "nome (A–Z)", en: "name (A–Z)" } },
  { value: "name-desc", label: { pt: "nome (Z–A)", en: "name (Z–A)" } },
  { value: "year-desc", label: { pt: "ano (mais recente)", en: "year (newest)" } },
  { value: "year-asc", label: { pt: "ano (mais antigo)", en: "year (oldest)" } },
] as const;

export type SortKey = (typeof SORTS)[number]["value"];

const SORT_VALUES: readonly string[] = SORTS.map((sort) => sort.value);

// Estado inteiro da tela: o que a URL carrega e o que o cliente lê de volta.
export type Query = {
  selected: Selected;
  q: string;
  sort: SortKey;
  density: DensityKey;
  page: number;
};

export const EMPTY_QUERY: Query = {
  selected: EMPTY_SELECTED,
  q: "",
  sort: "",
  density: "gallery",
  page: 1,
};

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function countSelected(selected: Selected): number {
  return FILTER_GROUPS.reduce((total, g) => total + selected[g].length, 0);
}

// Query "padrão" é a que o HTML estático já responde: sem busca, sem filtro,
// sem ordenação e na primeira página. É o que decide se o cliente assume a
// lista ou deixa a vitrine renderizada no servidor no lugar.
export function isDefaultQuery(query: Query): boolean {
  return (
    query.q === "" &&
    query.sort === "" &&
    query.density === "gallery" &&
    query.page === 1 &&
    countSelected(query.selected) === 0
  );
}

export function buildQuery(query: Query): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  for (const group of FILTER_GROUPS) {
    for (const value of query.selected[group]) params.append(group, value);
  }
  if (query.sort) params.set("sort", query.sort);
  if (query.density !== "gallery") params.set("density", query.density);
  if (query.page > 1) params.set("page", String(query.page));
  return params.toString();
}

export function buildHref(pathname: string, query: Query): string {
  const search = buildQuery(query);
  return search ? `${pathname}?${search}` : pathname;
}

// Tipado estruturalmente para aceitar tanto URLSearchParams quanto o
// ReadonlyURLSearchParams do next/navigation, que não é atribuível ao primeiro.
type ReadableParams = {
  get(name: string): string | null;
  getAll(name: string): string[];
};

export function parseQuery(params: ReadableParams): Query {
  const selected: Selected = { ...EMPTY_SELECTED };
  for (const group of FILTER_GROUPS) selected[group] = params.getAll(group);

  const sort = params.get("sort") ?? "";
  const density = params.get("density") ?? "";
  const page = Number(params.get("page"));

  return {
    selected,
    // Corta a busca: o valor vem da URL e alimenta um filtro em memória, mas
    // não há razão para carregar uma query string de tamanho arbitrário.
    q: (params.get("q") ?? "").slice(0, 80),
    sort: (SORT_VALUES.includes(sort) ? sort : "") as SortKey,
    density: (DENSITY_VALUES.includes(density) ? density : "gallery") as DensityKey,
    page: Number.isFinite(page) && page > 1 ? Math.floor(page) : 1,
  };
}

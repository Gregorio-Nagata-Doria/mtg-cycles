export const FILTER_GROUPS = ["set", "rarity", "structure"] as const;

export type FilterGroup = (typeof FILTER_GROUPS)[number];
export type Selected = Record<FilterGroup, string[]>;

export const EMPTY_SELECTED: Selected = { set: [], rarity: [], structure: [] };

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

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function buildQuery(selected: Selected): string {
  const params = new URLSearchParams();
  for (const group of FILTER_GROUPS) {
    for (const value of selected[group]) params.append(group, value);
  }
  return params.toString();
}

export function buildHref(
  pathname: string,
  selected: Selected,
  page?: number,
): string {
  const query = buildQuery(selected);
  const withPage = page && page > 1 ? `${query ? `${query}&` : ""}page=${page}` : query;
  return withPage ? `${pathname}?${withPage}` : pathname;
}

export function countSelected(selected: Selected): number {
  return FILTER_GROUPS.reduce((total, g) => total + selected[g].length, 0);
}

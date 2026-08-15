export const FILTER_GROUPS = ["set", "rarity", "structure"] as const;

export type FilterGroup = (typeof FILTER_GROUPS)[number];
export type Selected = Record<FilterGroup, string[]>;

export const EMPTY_SELECTED: Selected = { set: [], rarity: [], structure: [] };

export const RARITIES = [
  { value: "common", label: "Comum" },
  { value: "uncommon", label: "Incomum" },
  { value: "rare", label: "Rara" },
  { value: "mythic", label: "Mítica" },
];

// Derivado de RARITIES para que rótulo do filtro e rótulo exibido não possam
// divergir.
export const RARITY_LABELS: Record<string, string> = Object.fromEntries(
  RARITIES.map((rarity) => [rarity.value, rarity.label]),
);

export const STRUCTURES = [
  { value: "5-mono", label: "5 monocolores (WUBRG)" },
  { value: "10-duplas", label: "10 duplas" },
  { value: "5-aliadas", label: "5 duplas aliadas" },
  { value: "5-inimigas", label: "5 duplas inimigas" },
  { value: "artefatos", label: "Artefatos" },
  { value: "terras", label: "Terrenos" },
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

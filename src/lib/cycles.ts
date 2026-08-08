import cycles from "@cycles";
import { EMPTY_SELECTED, FILTER_GROUPS, type Selected } from "./filters";

export type Cycle = (typeof cycles)[number];

const WUBRG = "WUBRG";

const ALLIED = new Set(["WU", "UB", "BR", "RG", "WG"]);
const ENEMY = new Set(["WB", "UR", "BG", "WR", "UG"]);

const RARITY_ORDER = ["common", "uncommon", "rare", "mythic"];

function colorKey(colors: string[]): string {
  return [...colors]
    .sort((a, b) => WUBRG.indexOf(a) - WUBRG.indexOf(b))
    .join("");
}

export function cycleRarity(cycle: Cycle): string | null {
  const count: Record<string, number> = {};
  for (const card of cycle.cards) {
    if (!("rarity" in card)) continue;
    count[card.rarity] = (count[card.rarity] ?? 0) + 1;
  }
  const ranked = Object.keys(count).sort(
    (a, b) =>
      count[b] - count[a] || RARITY_ORDER.indexOf(b) - RARITY_ORDER.indexOf(a),
  );
  return ranked[0] ?? null;
}

export function cycleStructure(cycle: Cycle): string | null {
  const cards = cycle.cards.filter((card) => "typeLine" in card);
  if (cards.length === 0) return null;

  const keys = cards.map((card) => colorKey(card.colors));

  if (cards.every((card) => card.typeLine.includes("Land"))) return "terras";
  if (cards.every((c, i) => c.typeLine.includes("Artifact") && keys[i] === ""))
    return "artefatos";
  if (cards.length === 5 && keys.every((k) => k.length === 1) && new Set(keys).size === 5)
    return "5-mono";
  if (cards.length === 10 && keys.every((k) => k.length === 2)) return "10-duplas";
  if (cards.length === 5 && keys.every((k) => ALLIED.has(k))) return "5-aliadas";
  if (cards.length === 5 && keys.every((k) => ENEMY.has(k))) return "5-inimigas";
  return null;
}

const index = cycles.map((cycle) => ({
  cycle,
  rarity: cycleRarity(cycle),
  structure: cycleStructure(cycle),
}));

export function listSets(): { code: string; name: string }[] {
  const byCode = new Map<string, string>();
  for (const cycle of cycles) {
    if (!cycle.setCode || !cycle.setName) continue;
    byCode.set(cycle.setCode, cycle.setName);
  }
  return [...byCode]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

export function parseSelected(params: {
  [key: string]: string | string[] | undefined;
}): Selected {
  const selected: Selected = { ...EMPTY_SELECTED };
  for (const group of FILTER_GROUPS) {
    const raw = params[group];
    selected[group] = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  }
  return selected;
}

export function filterCycles(selected: Selected): Cycle[] {
  return index
    .filter(({ cycle, rarity, structure }) => {
      if (selected.set.length && !selected.set.includes(cycle.setCode ?? ""))
        return false;
      if (selected.rarity.length && (!rarity || !selected.rarity.includes(rarity)))
        return false;
      if (
        selected.structure.length &&
        (!structure || !selected.structure.includes(structure))
      )
        return false;
      return true;
    })
    .map(({ cycle }) => cycle);
}

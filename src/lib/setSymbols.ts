import symbols from "@setSymbols";
import type { Cycle } from "./cycles";

const table: Record<string, string> = symbols;

export function setSymbolSvg(cycle: Cycle): string | null {
  if (!cycle.setSymbol) return null;
  const key = cycle.setSymbol.split("?")[0].split("/").pop()?.replace(/\.svg$/, "");
  return (key && table[key]) || null;
}

"use client";

import { useState, type ReactNode } from "react";
import { T } from "./T";
import {
  COLORS,
  countSelected,
  RARITIES,
  SORTS,
  STRUCTURES,
  type FilterGroup,
  type Selected,
  type SortKey,
} from "@/lib/filters";

const SETS_PREVIEW = 8;
const YEARS_PREVIEW = 8;

// Componente de apresentação: quem guarda a query e escreve na URL é o
// <CycleCatalog>. A barra só mostra o que está marcado e avisa o que mudou —
// sem isso, sidebar e lista de resultados teriam dois estados para divergir.
export function FilterSidebar({
  sets,
  years,
  selected,
  sort,
  onToggle,
  onSort,
  onClear,
}: {
  sets: { code: string; name: string }[];
  years: number[];
  selected: Selected;
  sort: SortKey;
  onToggle: (group: FilterGroup, value: string) => void;
  onSort: (sort: SortKey) => void;
  onClear: () => void;
}) {
  const [showAllSets, setShowAllSets] = useState(false);
  const [showAllYears, setShowAllYears] = useState(false);

  const visibleSets = showAllSets ? sets : sets.slice(0, SETS_PREVIEW);
  const visibleYears = showAllYears ? years : years.slice(0, YEARS_PREVIEW);
  const total = countSelected(selected);

  return (
    <aside className="w-full shrink-0 border-b border-border bg-panel md:w-64 md:border-r md:border-b-0">
      {/* Colapsa só abaixo de md, sem JS: <details> fechado por padrão, e em
          md+ o conteúdo é forçado a aparecer. São duas regras porque os
          motores escondem de dois jeitos — ::details-content nos atuais,
          display:none nos filhos nos antigos — e as duas são do autor, então
          ganham do user-agent nos dois casos. */}
      <details className="group/filtros md:[&::details-content]:[block-size:auto] md:[&::details-content]:[content-visibility:visible] md:[&>*:not(summary)]:block">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 md:hidden [&::-webkit-details-marker]:hidden">
          <span className="font-serif text-[16px] font-bold">
            <T pt="Filtros e ordenação" en="Filters and sorting" />
            {total > 0 && (
              <span className="ml-2 align-middle font-sans text-[11.5px] font-normal text-gold">
                {total}
              </span>
            )}
          </span>
          <span
            aria-hidden="true"
            className="text-[11px] text-muted transition-transform group-open/filtros:rotate-180"
          >
            ▼
          </span>
        </summary>

        <div className="px-5 pt-5 pb-8 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
          <div className="hidden h-6 items-center justify-between md:flex">
            <h2 className="font-serif text-[17px] font-bold">
              <T pt="Filtros" en="Filters" />
            </h2>
          </div>

          {total > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="mt-1 text-[11.5px] text-muted underline-offset-2 hover:text-gold hover:underline"
            >
              <T pt={`limpar filtros (${total})`} en={`clear filters (${total})`} />
            </button>
          )}

          <Group title={<T pt="Ordenar por" en="Sort by" />}>
            {SORTS.map((option) => (
              <Check
                key={option.value || "catalogo"}
                round
                label={<T {...option.label} />}
                checked={sort === option.value}
                onChange={() => onSort(option.value)}
              />
            ))}
          </Group>

          {/* Nome de set vem da Scryfall e já é inglês — não passa pelo <T>. */}
          <Group title={<T pt="Set / coleção" en="Set / collection" />}>
            {visibleSets.map((set) => (
              <Check
                key={set.code}
                label={set.name}
                checked={selected.set.includes(set.code)}
                onChange={() => onToggle("set", set.code)}
              />
            ))}
            <More
              expanded={showAllSets}
              onToggle={() => setShowAllSets((v) => !v)}
              label={{
                pt: `ver todos os sets (${sets.length})`,
                en: `show all sets (${sets.length})`,
              }}
            />
          </Group>

          <Group title={<T pt="Raridade" en="Rarity" />}>
            {RARITIES.map((rarity) => (
              <Check
                key={rarity.value}
                label={<T {...rarity.label} />}
                checked={selected.rarity.includes(rarity.value)}
                onChange={() => onToggle("rarity", rarity.value)}
              />
            ))}
          </Group>

          <Group title={<T pt="Estrutura do ciclo" en="Cycle structure" />}>
            {STRUCTURES.map((structure) => (
              <Check
                key={structure.value}
                label={<T {...structure.label} />}
                checked={selected.structure.includes(structure.value)}
                onChange={() => onToggle("structure", structure.value)}
              />
            ))}
          </Group>

          <Group title={<T pt="Cor" en="Color" />}>
            {COLORS.map((color) => (
              <Check
                key={color.value}
                label={<T {...color.label} />}
                checked={selected.color.includes(color.value)}
                onChange={() => onToggle("color", color.value)}
              />
            ))}
          </Group>

          <Group title={<T pt="Ano" en="Year" />}>
            {visibleYears.map((year) => (
              <Check
                key={year}
                label={String(year)}
                checked={selected.year.includes(String(year))}
                onChange={() => onToggle("year", String(year))}
              />
            ))}
            <More
              expanded={showAllYears}
              onToggle={() => setShowAllYears((v) => !v)}
              label={{
                pt: `ver todos os anos (${years.length})`,
                en: `show all years (${years.length})`,
              }}
            />
          </Group>
        </div>
      </details>
    </aside>
  );
}

function More({
  expanded,
  onToggle,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: { pt: string; en: string };
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-1.5 self-start text-[12px] text-muted underline-offset-2 hover:text-gold hover:underline"
    >
      {expanded ? <T pt="ver menos" en="show less" /> : <T {...label} />}
    </button>
  );
}

function Group({
  title,
  children,
}: {
  title: ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border py-4 last:border-b-0">
      <h3 className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Check({
  label,
  checked,
  round,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  round?: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-[3px] text-[13.5px] text-secondary-body hover:text-foreground">
      <input
        type={round ? "radio" : "checkbox"}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={`flex size-3.5 shrink-0 items-center justify-center border border-checkbox-off bg-input transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-gold/40 ${
          round ? "rounded-full" : "rounded-[3px]"
        }`}
      >
        <svg
          viewBox="0 0 10 8"
          aria-hidden="true"
          className="size-2 opacity-0 transition-opacity"
        >
          <path
            d="M1 4.2 3.6 6.8 9 1.2"
            fill="none"
            stroke="var(--primary-foreground)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="truncate">{label}</span>
    </label>
  );
}

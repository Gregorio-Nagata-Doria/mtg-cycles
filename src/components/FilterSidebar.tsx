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
  type Label,
  type Selected,
  type SortKey,
} from "@/lib/filters";

const PREVIEW = 8;

// Acima disto o grupo ganha campo de busca interno. 4 raridades ou 6 cores nao
// precisam; 181 sets e 34 anos precisam.
const SEARCH_THRESHOLD = 12;

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
  const total = countSelected(selected);

  return (
    <aside className="w-full shrink-0 border-b border-border bg-panel md:w-64 md:border-r md:border-b-0">
      {/* Colapsa só abaixo de md, sem JS: <details> fechado por padrão, e em
          md+ o conteúdo é forçado a aparecer. São duas regras porque os
          motores escondem de dois jeitos — ::details-content nos atuais,
          display:none nos filhos nos antigos — e as duas são do autor, então
          ganham do user-agent nos dois casos. */}
      <details className="group/filtros md:[&::details-content]:[block-size:auto] md:[&::details-content]:[content-visibility:visible] md:[&>*:not(summary)]:block">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 md:hidden [&::-webkit-details-marker]:hidden">
          <span className="font-serif text-body font-bold">
            <T pt="Filtros e ordenação" en="Filters and sorting" />
            {total > 0 && (
              <span className="ml-2 align-middle font-sans text-meta font-normal text-gold">
                {total}
              </span>
            )}
          </span>
          <span
            aria-hidden="true"
            className="text-meta text-muted transition-transform group-open/filtros:rotate-180"
          >
            ▼
          </span>
        </summary>

        <div className="px-5 pt-5 pb-8 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
          <div className="hidden h-6 items-center justify-between md:flex">
            <h2 className="font-serif text-body font-bold">
              <T pt="Filtros" en="Filters" />
            </h2>
          </div>

          {total > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="mt-1 text-meta text-muted underline-offset-2 hover:text-gold hover:underline"
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
          <LongGroup
            title={<T pt="Set / coleção" en="Set / collection" />}
            options={sets.map((set) => ({
              key: set.code,
              text: set.name,
              label: set.name,
              checked: selected.set.includes(set.code),
              onChange: () => onToggle("set", set.code),
            }))}
            allLabel={{
              pt: `ver todos os sets (${sets.length})`,
              en: `show all sets (${sets.length})`,
            }}
            searchLabel={{ pt: "filtrar sets", en: "filter sets" }}
            emptyLabel={{ pt: "nenhum set com esse nome", en: "no set with that name" }}
          />

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

          <LongGroup
            title={<T pt="Ano" en="Year" />}
            options={years.map((year) => ({
              key: String(year),
              text: String(year),
              label: String(year),
              checked: selected.year.includes(String(year)),
              onChange: () => onToggle("year", String(year)),
            }))}
            allLabel={{
              pt: `ver todos os anos (${years.length})`,
              en: `show all years (${years.length})`,
            }}
            searchLabel={{ pt: "filtrar anos", en: "filter years" }}
            emptyLabel={{ pt: "nenhum ano com esse número", en: "no year with that number" }}
          />
        </div>
      </details>
    </aside>
  );
}

type Option = {
  key: string;
  // O que a busca interna compara. Separado do `label` porque o rótulo pode ser
  // ReactNode e não dá para procurar dentro de um nó.
  text: string;
  label: ReactNode;
  checked: boolean;
  onChange: () => void;
};

// Grupo longo: os 181 sets e os 34 anos. O "ver todos" sozinho só trocava 8
// caixas por 181 de uma vez — Hick's Law em estado puro, e sem nenhuma forma de
// chegar a um set específico a não ser lendo a lista inteira.
//
// O campo interno só aparece acima do limiar: para 4 raridades ou 6 cores ele
// seria mais um controle a ler do que uma ajuda.
function LongGroup({
  title,
  options,
  allLabel,
  searchLabel,
  emptyLabel,
}: {
  title: ReactNode;
  options: Option[];
  allLabel: Label;
  searchLabel: Label;
  emptyLabel: Label;
}) {
  const [expanded, setExpanded] = useState(false);
  const [term, setTerm] = useState("");

  const searchable = options.length > SEARCH_THRESHOLD;
  const needle = term.trim().toLowerCase();
  const found = needle
    ? options.filter((option) => option.text.toLowerCase().includes(needle))
    : options;

  // Buscando, a lista vem inteira: cortar em 8 o que a pessoa acabou de pedir
  // esconderia resultado sem avisar. O corte só vale para a lista em repouso.
  const visible = needle || expanded ? found : found.slice(0, PREVIEW);

  return (
    <Group title={title}>
      {searchable && (
        <label className="mb-2 flex flex-col gap-1">
          {/* Rótulo visível, como no campo de busca do catálogo: placeholder é
              atributo e o CSS que troca o idioma não alcança atributo. */}
          <span className="text-meta font-semibold tracking-[0.14em] text-muted uppercase">
            <T {...searchLabel} />
          </span>
          <span className="flex items-center rounded-lg border border-border-input bg-input px-2 py-2 focus-within:border-gold focus-within:focus-ring">
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              className="w-full min-w-0 bg-transparent text-ui text-foreground outline-none"
            />
          </span>
        </label>
      )}

      {/* max-h só quando a lista está aberta: 181 caixas empurrariam o resto da
          barra para fora da tela. 16rem é múltiplo de 4 e cabe ~10 linhas. */}
      <div
        className={
          needle || expanded
            ? "flex max-h-64 flex-col overflow-y-auto pr-1"
            : "flex flex-col"
        }
      >
        {visible.map((option) => (
          <Check
            key={option.key}
            label={option.label}
            checked={option.checked}
            onChange={option.onChange}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-1 text-ui text-muted">
          <T {...emptyLabel} />
        </p>
      )}

      {/* Enquanto há busca não há o que expandir — a lista já está completa. */}
      {!needle && found.length > PREVIEW && (
        <More
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          label={allLabel}
        />
      )}
    </Group>
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
      className="mt-2 self-start text-meta text-muted underline-offset-2 hover:text-gold hover:underline"
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
      <h3 className="mb-2 text-meta font-semibold tracking-[0.14em] text-muted uppercase">
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
    <label className="flex cursor-pointer items-center gap-2 py-1 text-ui text-secondary-body hover:text-foreground">
      <input
        type={round ? "radio" : "checkbox"}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={`flex size-3.5 shrink-0 items-center justify-center border border-checkbox-off bg-input transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:[&>*]:opacity-100 peer-focus-visible:focus-ring ${
          round ? "rounded-full" : "rounded-[3px]"
        }`}
      >
        {/* Radio marca com ponto, checkbox com visto. Só a forma da caixa
            (rounded-full vs rounded-[3px]) numa caixa de 14px não distingue
            "um de N" de "N de N" — a diferença semântica ficava ilegível
            porque os dois desenhavam o mesmo visto por cima. */}
        {round ? (
          <span className="size-1.5 rounded-full bg-primary-foreground opacity-0 transition-opacity" />
        ) : (
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
        )}
      </span>
      <span className="truncate">{label}</span>
    </label>
  );
}

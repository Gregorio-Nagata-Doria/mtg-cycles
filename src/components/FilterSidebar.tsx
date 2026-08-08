"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildHref,
  countSelected,
  EMPTY_SELECTED,
  RARITIES,
  STRUCTURES,
  toggleValue,
  type FilterGroup,
  type Selected,
} from "@/lib/filters";

const SETS_PREVIEW = 8;

export function FilterSidebar({
  sets,
  selected,
}: {
  sets: { code: string; name: string }[];
  selected: Selected;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showAllSets, setShowAllSets] = useState(false);

  const [optimistic, setOptimistic] = useOptimistic(selected);
  const [isPending, startTransition] = useTransition();

  function navigate(next: Selected) {
    startTransition(() => {
      setOptimistic(next);
      router.replace(buildHref(pathname, next), { scroll: false });
    });
  }

  function toggle(group: FilterGroup, value: string) {
    navigate({ ...optimistic, [group]: toggleValue(optimistic[group], value) });
  }

  const visibleSets = showAllSets ? sets : sets.slice(0, SETS_PREVIEW);
  const total = countSelected(optimistic);

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-panel">
      <div className="sticky top-0 max-h-screen overflow-y-auto px-5 pt-5 pb-8">
      <div className="flex h-6 items-center justify-between">
        <h2 className="font-serif text-[17px] font-bold">
          Filtros
          {isPending && (
            <span className="ml-2 align-middle text-[11px] font-sans font-normal text-muted-weak">
              atualizando…
            </span>
          )}
        </h2>
        {total > 0 && (
          <button
            type="button"
            onClick={() => navigate(EMPTY_SELECTED)}
            className="text-[11.5px] text-muted underline-offset-2 hover:text-gold hover:underline"
          >
            limpar ({total})
          </button>
        )}
      </div>

      <Group title="Set / coleção">
        {visibleSets.map((set) => (
          <Check
            key={set.code}
            label={set.name}
            checked={optimistic.set.includes(set.code)}
            onChange={() => toggle("set", set.code)}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowAllSets((v) => !v)}
          className="mt-1.5 self-start text-[12px] text-muted underline-offset-2 hover:text-gold hover:underline"
        >
          {showAllSets ? "ver menos" : `ver todos os sets (${sets.length})`}
        </button>
      </Group>

      <Group title="Raridade">
        {RARITIES.map((rarity) => (
          <Check
            key={rarity.value}
            label={rarity.label}
            checked={optimistic.rarity.includes(rarity.value)}
            onChange={() => toggle("rarity", rarity.value)}
          />
        ))}
      </Group>

      <Group title="Estrutura do ciclo">
        {STRUCTURES.map((structure) => (
          <Check
            key={structure.value}
            label={structure.label}
            checked={optimistic.structure.includes(structure.value)}
            onChange={() => toggle("structure", structure.value)}
          />
        ))}
      </Group>
      </div>
    </aside>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
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
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-[3px] text-[13.5px] text-secondary-body hover:text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border border-checkbox-off bg-input transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-gold/40">
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

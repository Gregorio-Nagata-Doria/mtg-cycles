"use client";

import { T } from "./T";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  return (
    // p-1.5 leva o alvo de 31x15 para 27x27 — o mínimo da SC 2.5.8 é 24x24.
    <button
      type="button"
      onClick={toggle}
      className="flex cursor-pointer items-center rounded-sm p-1.5"
    >
      <span className="size-3.75 rounded-full border border-gold-weak bg-[linear-gradient(90deg,var(--primary)_50%,var(--panel)_50%)]" />
      <span className="sr-only">
        <T pt="Alternar tema" en="Toggle theme" />
      </span>
    </button>
  );
}

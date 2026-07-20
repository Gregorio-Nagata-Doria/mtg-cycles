"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";

export function ThemeToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  function changeLanguage(language: string) {
    // const url = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
    // router.push(url.replace(/pt|en/, language));
  }

  return (
    <div className="font-sans bg-panel rounded-full px-5 py-1 flex items-center gap-1 text-sm border-chip-foreground border">
      <label
        onClick={() => changeLanguage("pt")}
        className="cursor-pointer hover:font-black font-bold"
      >
        PT
      </label>
      <label
        onClick={() => changeLanguage("en")}
        className="cursor-pointer hover:font-black font-bold"
      >
        EN
      </label>

      <span className="mx-1 h-4.5 w-px bg-border-input" />

      <button
        onClick={toggle}
        aria-label="Alternar tema"
        className="flex cursor-pointer items-center px-2"
      >
        <span className="size-3.75 rounded-full border border-gold-weak bg-[linear-gradient(90deg,var(--primary)_50%,var(--panel)_50%)]" />
      </button>
    </div>
  );
}

"use client";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="flex cursor-pointer items-center px-2"
    >
      <span className="size-3.75 rounded-full border border-gold-weak bg-[linear-gradient(90deg,var(--primary)_50%,var(--panel)_50%)]" />
    </button>
  );
}

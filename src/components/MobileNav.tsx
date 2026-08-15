"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/ciclos", label: "Ciclos" },
  { href: "/sobre", label: "Sobre" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="menu-mobile"
        onClick={() => setOpen((value) => !value)}
        className="flex flex-col gap-1 p-3"
      >
        <span className="h-0.5 w-4.5 bg-secondary" />
        <span className="h-0.5 w-4.5 bg-secondary" />
        <span className="h-0.5 w-4.5 bg-secondary" />
      </button>

      {open && (
        <nav
          id="menu-mobile"
          className="absolute top-full right-0 z-50 w-44 border-b border-l border-border bg-panel shadow-card"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-b border-border px-5 py-3 text-[15px] last:border-b-0 hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

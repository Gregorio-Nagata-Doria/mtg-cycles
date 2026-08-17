"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isCurrent, LINKS } from "./NavLinks";
import { T } from "./T";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
      {/* O nome acessível vem do conteúdo, não de aria-label: atributo não é
          alcançado pelo CSS que troca o idioma. O ramo escondido está em
          display:none, que fica de fora do cálculo do nome. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        onClick={() => setOpen((value) => !value)}
        className="flex flex-col gap-1 p-3"
      >
        <span className="h-0.5 w-4.5 bg-secondary" />
        <span className="h-0.5 w-4.5 bg-secondary" />
        <span className="h-0.5 w-4.5 bg-secondary" />
        <span className="sr-only">
          {open ? (
            <T pt="Fechar menu" en="Close menu" />
          ) : (
            <T pt="Abrir menu" en="Open menu" />
          )}
        </span>
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
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className="block border-b border-border px-5 py-3 text-[15px] last:border-b-0 hover:text-gold aria-[current=page]:font-semibold aria-[current=page]:text-gold"
            >
              <T pt={link.pt} en={link.en} />
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

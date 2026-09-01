"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isCurrent, LINKS } from "./NavLinks";
import { T } from "./T";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  // Só o Escape devolve o foco ao botão. Fechar clicando num link não pode:
  // ali a navegação já está levando o foco para a página nova, e puxá-lo de
  // volta para o hambúrguer jogaria o leitor para trás.
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (!open) return;

    // O foco fica no botão ao abrir, como manda o padrão de disclosure — o
    // Tab entra no menu sozinho porque a <nav> vem depois dele no DOM. O que
    // faltava era o ciclo: sem isto o Tab saía do menu aberto e ia para o
    // conteúdo atrás dele, que está coberto e não devia receber foco.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        restoreFocus.current = true;
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const items: HTMLElement[] = [
        ...(buttonRef.current ? [buttonRef.current] : []),
        ...Array.from(navRef.current?.querySelectorAll("a") ?? []),
      ];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    buttonRef.current?.focus();
  }, [open]);

  return (
    <div className="md:hidden">
      {/* O nome acessível vem do conteúdo, não de aria-label: atributo não é
          alcançado pelo CSS que troca o idioma. O ramo escondido está em
          display:none, que fica de fora do cálculo do nome. */}
      <button
        ref={buttonRef}
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
          ref={navRef}
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

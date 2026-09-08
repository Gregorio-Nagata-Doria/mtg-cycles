import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="relative w-full border-chip-border border-b-2">
      {/* A borda atravessa a tela inteira; o conteúdo do cabeçalho, não. Com o
          px-3 de antes a marca ficava a 12px da borda enquanto o conteúdo da
          página começava a ~408px num monitor largo — a mesma page-shell aqui
          põe os dois na mesma coluna.
          ⚠️ O `relative` fica no <header> de propósito: o menu mobile é
          `absolute right-0` e tem de encostar na borda da tela, não na casca. */}
      <div className="page-shell flex justify-between items-center py-3">
        {/* gap-10 entre marca e nav, gap-6 dentro da nav (ver <NavLinks>): o
            gap-14 uniforme de antes não agrupava nada. */}
        <span className="flex gap-10 items-baseline">
          <Link
            href="/"
            className="font-serif text-section font-bold text-foreground tracking-[.02em]"
          >
            <span className="mr-2 inline-block size-2.75 rounded-full border-[1.5px] border-gold align-middle" />
            Ciclopédia
          </Link>
          <NavLinks />
        </span>
        <span className="flex flex-row items-center gap-1">
          {/* py-1 é o degrau mínimo da grade de 4pt — o py-0.5 (2px) que
              estava aqui era o último valor de espaçamento fora dela. Quem
              garante os 24x24 da SC 2.5.8 são os botões de dentro, que têm
              preenchimento próprio; à pastilha só cabe a folga da borda. */}
          <span className="font-sans bg-panel rounded-full px-3 py-1 flex items-center gap-1 text-ui border-chip-foreground border">
            <LanguageToggle />
            <span className="mx-1 h-4.5 w-px bg-border" />
            <ThemeToggle />
          </span>
          <MobileNav />
        </span>
      </div>
    </header>
  );
}

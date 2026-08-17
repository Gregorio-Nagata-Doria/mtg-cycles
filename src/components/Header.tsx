import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="relative w-full px-3 py-3 flex justify-between items-center border-chip-border border-b-2">
      {/* gap-10 entre marca e nav, gap-6 dentro da nav (ver <NavLinks>): o
          gap-14 uniforme de antes não agrupava nada. */}
      <span className="flex gap-10 items-baseline">
        <Link
          href="/"
          className="font-serif text-[27px] font-bold text-foreground tracking-[.02em]"
        >
          <span className="mr-2.5 inline-block size-2.75 rounded-full border-[1.5px] border-gold align-middle" />
          Ciclopédia
        </Link>
        <NavLinks />
      </span>
      <span className="flex flex-row items-center gap-1">
        {/* py-0.5 compensa o preenchimento que os botões ganharam para chegar
            aos 24x24 da SC 2.5.8 — sem isso a pastilha cresceria 8px. */}
        <span className="font-sans bg-panel rounded-full px-3 py-0.5 flex items-center gap-1 text-sm border-chip-foreground border">
          <LanguageToggle />
          <span className="mx-1 h-4.5 w-px bg-border" />
          <ThemeToggle />
        </span>
        <MobileNav />
      </span>
    </header>
  );
}

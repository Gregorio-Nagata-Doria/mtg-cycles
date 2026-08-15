import Link from "next/link";
import { Suspense } from "react";
import { LanguageToggle, LanguageToggleFallback } from "./LanguageToggle";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="relative w-full px-3 py-3 flex justify-between items-center border-chip-border border-b-2">
      <span className="flex gap-14 items-baseline font-semibold text-[20px]">
        {" "}
        <Link
          href="/"
          className="font-serif text-[27px] font-bold text-foreground tracking-[.02em]"
        >
          <span className="mr-2.5 inline-block size-2.75 rounded-full border-[1.5px] border-gold align-middle" />
          Ciclopédia
        </Link>{" "}
        <Link href="/ciclos" className="hidden md:block">
          Ciclos
        </Link>
        <Link href="/sobre" className="hidden md:block">
          Sobre
        </Link>{" "}
      </span>
      <span className="flex flex-row items-center gap-1">
        <span className="font-sans bg-panel rounded-full px-5 py-1 flex items-center gap-1 text-sm border-chip-foreground border">
          <Suspense fallback={<LanguageToggleFallback />}>
            <LanguageToggle />
          </Suspense>
          <span className="mx-1 h-4.5 w-px bg-border-input" />
          <ThemeToggle />
        </span>
        <MobileNav />
      </span>
    </header>
  );
}

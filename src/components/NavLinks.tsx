"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "./T";

// Uma lista só para as duas navs. O menu do telefone (<MobileNav>) importa
// daqui — duas cópias divergiriam no primeiro link novo.
export const LINKS = [
  { href: "/ciclos", pt: "Ciclos", en: "Cycles" },
  { href: "/sobre", pt: "Sobre", en: "About" },
];

// /ciclos/<slug> continua sendo "Ciclos": o item marcado é a seção, não a URL
// exata, senão a página de ciclo aparece como se estivesse fora da navegação.
export function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Cliente por causa do usePathname — é o único jeito de ler a rota, e ler do
// servidor não é suportado (doc da 16.2.10, functions/use-pathname). Não custa
// boundary de Suspense como useSearchParams custaria: a doc só a exige com
// cacheComponents ligado, e mesmo assim ela é opcional onde há
// generateStaticParams. Não há rewrite nem proxy no next.config, então também
// não há o risco de divergência de hidratação que a doc descreve.
export function NavLinks() {
  const pathname = usePathname();

  return (
    // gap-6 aqui contra o gap maior que separa a marca: sem essa diferença,
    // "Ciclopédia" ficava equidistante de "Ciclos" e lia como um terceiro
    // item de menu em vez de marca (lei da proximidade).
    <nav className="hidden items-baseline gap-6 text-[17px] font-semibold md:flex">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
          // O sublinhado é o que carrega a informação; a cor só reforça.
          // Cor sozinha não pode ser o único portador (WCAG 1.4.1).
          className="underline-offset-8 hover:text-gold aria-[current=page]:text-gold aria-[current=page]:underline aria-[current=page]:decoration-2"
        >
          <T pt={link.pt} en={link.en} />
        </Link>
      ))}
    </nav>
  );
}

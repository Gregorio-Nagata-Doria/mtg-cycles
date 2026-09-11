import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { T } from "@/components/T";
import { Cormorant_Garamond, IBM_Plex_Sans } from "next/font/google";
import { OG_BASE } from "@/lib/openGraph";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
});

import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_DESCRIPTION =
  "Um catálogo dos ciclos de Magic: The Gathering — grupos de cartas irmãs, uma por cor, de 1993 até hoje.";

// A metadata fica só em PT, aqui e nas páginas. Ela é resolvida no build e vai
// para o <head> como texto — o CSS que troca o idioma do corpo não alcança
// <title> nem og:*. Traduzir isso exigiria uma rota por idioma, que é
// exatamente o que a decisão de não indexar inglês evitou (951 rotas a mais).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ciclopédia — os ciclos de Magic: The Gathering",
    template: "%s — Ciclopédia",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...OG_BASE,
    title: "Ciclopédia — os ciclos de Magic: The Gathering",
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html
        lang="pt-BR"
        data-theme="light"
        data-lang="pt"
        className={`${cormorant.variable} ${plexSans.variable} h-full antialiased bg-background`}
        suppressHydrationWarning
      >
        <head>
          {/* Roda antes da pintura para tema e idioma não piscarem. O idioma só
              mexe no DOM quando for "en": pt é o que já veio no HTML. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var d=document.documentElement;try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=t}catch(e){}try{if(localStorage.getItem("lang")==="en"){d.dataset.lang="en";d.lang="en"}}catch(e){}})()`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
          {/* Primeiro nó focável da página: sem ele, chegar ao conteúdo por
              teclado custa toda a navegação e os dois toggles a cada rota
              (WCAG 2.4.1). sr-only até receber foco. */}
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:border focus:border-border-input focus:bg-panel focus:px-4 focus:py-2 focus:text-ui"
          >
            <T pt="Pular para o conteúdo" en="Skip to content" />
          </a>
          <Header />
          <main id="conteudo" className="flex flex-1 flex-col">
            {children}
          </main>
          {/* flex-wrap: item de flex só encolhe até a maior palavra dele, e com
              quatro itens a soma disso pode passar da largura de um telefone de
              320px. Sem quebra de linha, a página estouraria na horizontal. */}
          <footer className="w-full border-t border-border flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-8 py-4 text-meta text-muted">
            {/* prefetch={false}: o footer está em toda página, e o padrão
                baixaria os 951 links do índice de todo visitante que rolasse
                até o fim — para uma página que quase ninguém abre. */}
            <Link href="/ciclos/indice" prefetch={false} className="text-gold">
              <T pt="Índice de ciclos" en="Cycle index" />
            </Link>
            <span className="text-border">◆</span>
            <span>
              <T pt="Dados e imagens:" en="Data and images:" />{" "}
              <a href="https://scryfall.com" className="text-gold">
                Scryfall
              </a>
            </span>
            <span className="text-border">◆</span>
            <span>
              <T
                pt="Magic: The Gathering é marca da Wizards of the Coast"
                en="Magic: The Gathering is a trademark of Wizards of the Coast"
              />
            </span>
            <span className="text-border">◆</span>
            <a
              href="https://github.com/Gregorio-Nagata-Doria"
              className="text-gold"
            >
              GitHub
            </a>
          </footer>
        </body>
      </html>
    </>
  );
}

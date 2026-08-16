import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { T } from "@/components/T";
import { Cormorant_Garamond, IBM_Plex_Sans } from "next/font/google";
import cycles from "@cycles";

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

// og:image das rotas que não são de ciclo (home, /ciclos, /sobre). Reaproveita
// um artCrop já coletado em vez de um PNG próprio: por ser URL absoluta da
// Scryfall, funciona mesmo com NEXT_PUBLIC_SITE_URL indefinida — caminho local
// seria resolvido contra o metadataBase e sairia como localhost.
const OG_CARD = cycles
  .find((cycle) => cycle.slug === "cycle-m11-titan")
  ?.cards.find((card) => card.name === "Sun Titan");
const OG_IMAGE = OG_CARD && "artCrop" in OG_CARD ? OG_CARD.artCrop : null;

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
    type: "website",
    locale: "pt_BR",
    siteName: "Ciclopédia",
    title: "Ciclopédia — os ciclos de Magic: The Gathering",
    description: SITE_DESCRIPTION,
    url: "/",
    ...(OG_IMAGE && {
      images: [
        {
          url: OG_IMAGE,
          width: 626,
          height: 457,
          alt: "Sun Titan, do ciclo dos Titãs de Magic 2011",
        },
      ],
    }),
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
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="w-full border-t border-border flex items-center justify-center gap-5 px-8 py-4 text-xs text-muted">
            <span>
              <T pt="Dados e imagens:" en="Data and images:" />{" "}
              <a href="https://scryfall.com" className="text-gold">
                Scryfall
              </a>
            </span>
            <span className="text-border-input">◆</span>
            <span>
              <T
                pt="Magic: The Gathering é marca da Wizards of the Coast"
                en="Magic: The Gathering is a trademark of Wizards of the Coast"
              />
            </span>
            <span className="text-border-input">◆</span>
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

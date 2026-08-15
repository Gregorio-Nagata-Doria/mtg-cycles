import type { Metadata } from "next";
import { Header } from "@/components/Header";
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
        className={`${cormorant.variable} ${plexSans.variable} h-full antialiased bg-background`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="w-full border-t border-border flex items-center justify-center gap-5 px-8 py-4 text-xs text-muted">
            <span>
              Dados e imagens:{" "}
              <a href="https://scryfall.com" className="text-gold">
                Scryfall
              </a>
            </span>
            <span className="text-border-input">◆</span>
            <span>Magic: The Gathering é marca da Wizards of the Coast</span>
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

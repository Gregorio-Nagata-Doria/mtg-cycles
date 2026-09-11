import type { Metadata } from "next";
import cycles from "@cycles";

// O que toda og:* do site repete. O merge de metadata do App Router é raso:
// página que declara openGraph substitui o do layout inteiro, e página que não
// declara herda o do layout inteiro — com og:url apontando para a home. Então
// cada página declara o seu, e type, locale, siteName e a imagem vêm daqui em
// vez de copiados à mão.
//
// Importa @cycles: só server component pode importar este módulo. Por isso ele
// não mora no site.ts, que é leve e pode acabar importado por qualquer um.

// og:image das rotas que não são de ciclo. Reaproveita um artCrop já coletado
// em vez de um PNG próprio: por ser URL absoluta da Scryfall, funciona mesmo
// com NEXT_PUBLIC_SITE_URL indefinida — caminho local seria resolvido contra o
// metadataBase e sairia como localhost.
const OG_CARD = cycles
  .find((cycle) => cycle.slug === "cycle-m11-titan")
  ?.cards.find((card) => card.name === "Sun Titan");
const OG_IMAGE = OG_CARD && "artCrop" in OG_CARD ? OG_CARD.artCrop : null;

// satisfies e não anotação: confere o formato sem alargar o tipo. Anotado como
// OpenGraph, o objeto viraria a união dos 13 formatos que o Next aceita; assim
// ele continua sendo exatamente o que está escrito, com type: "website".
export const OG_BASE = {
  type: "website",
  locale: "pt_BR",
  siteName: "Ciclopédia",
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
} satisfies NonNullable<Metadata["openGraph"]>;

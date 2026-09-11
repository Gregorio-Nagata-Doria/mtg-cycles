import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { List } from "@/components/List";
import { Ornament } from "@/components/Ornament";
import { T } from "@/components/T";
import { SITE_URL } from "@/lib/site";

// Aqui e não no layout: canonical declarada no layout é herdada por toda página
// que não declara a sua, e um esquecimento canonicalizaria o site para a home.
// Título, descrição e openGraph continuam vindo do layout.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// O nome do site no resultado do Google. Só na home, como o Google pede — e
// por isso aqui e não no layout. alternateName é o fallback se ele não usar o
// name: "Ciclopédia MTG" bate com o domínio e é único, onde "Cyclopedia"
// seria só uma palavra do inglês. O `url` vai absoluto porque JSON-LD não
// passa pelo metadataBase.
const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ciclopédia",
  alternateName: "Ciclopédia MTG",
  url: `${SITE_URL}/`,
};

export default function Home() {
  return (
    <div className="page-shell flex flex-col items-center py-16 sm:py-24">
      {/* Mesmo padrão do BreadcrumbList em ciclos/[cycle]/page.tsx: <script>
          nativo, com o "<" escapado. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(WEBSITE).replace(/</g, "\\u003c"),
        }}
      />
      <Ornament />
      <h1 className="font-serif font-bold display-1">Ciclopédia</h1>
      <p className="mt-4 max-w-measure text-center text-body leading-[1.7] text-pretty text-secondary-body sm:leading-[1.75]">
        <T
          pt="Um catálogo dos ciclos de Magic: The Gathering — grupos de cartas irmãs, uma por cor, reunidos como numa enciclopédia."
          en="A catalog of Magic: The Gathering cycles — groups of sibling cards, one per color, gathered as in an encyclopedia."
        />
      </p>

      <div className="mt-7 mb-16 flex flex-wrap items-center justify-center gap-3">
        <Button
          text={<T pt="Ver todos os ciclos" en="Browse all cycles" />}
          href="/ciclos"
        />
        <Button
          text={<T pt="O que é um ciclo?" en="What is a cycle?" />}
          href="/sobre"
          variant="secondary"
        />
      </div>

      <section className="w-full">
        <h2 className="font-serif text-section font-semibold rule-double">
          <T pt="Ciclos em destaque" en="Featured cycles" />
        </h2>
        <p className="mt-3 text-ui text-muted">
          <T
            pt="Seis ciclos cujas cinco artes foram feitas como um conjunto — uma carta por cor."
            en="Six cycles whose five arts were made as one set — one card per color."
          />
        </p>
        <List />
      </section>
    </div>
  );
}

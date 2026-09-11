import type { Metadata } from "next";
import Link from "next/link";
import { Ornament } from "@/components/Ornament";
import { T } from "@/components/T";

import cycles from "@cycles";
import { cycleSetLine, type Cycle } from "@/lib/cycles";
import { OG_BASE } from "@/lib/openGraph";

const PATH = "/ciclos/indice";
const TITLE = "Índice de ciclos";
const DESCRIPTION = `Os ${cycles.length} ciclos de Magic: The Gathering catalogados, em ordem alfabética, com o set e o ano de cada um.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { ...OG_BASE, title: TITLE, description: DESCRIPTION, url: PATH },
};

// Esta página existe para que todo ciclo tenha um <a href> no HTML estático.
// Sem ela, só a vitrine de /ciclos e os destaques da home recebiam link; o
// resto o Google só conhecia pelo sitemap, que ele trata como sugestão de URL,
// não como link. Com o link no footer, qualquer ciclo fica a dois cliques de
// qualquer página.

// Letra sem acento: o NFD separa "É" em "E" + acento, então "Élfico" entra no
// E e não num grupo "É" à parte. Nome que não começa com letra vai para "#".
function initial(name: string): string {
  const letter = name.normalize("NFD").charAt(0).toUpperCase();
  return /[A-Z]/.test(letter) ? letter : "#";
}

// Ordem total: há nomes PT repetidos entre ciclos de sets diferentes, e sem
// desempate a posição deles dependeria de o sort do runtime ser estável. O
// locale vai explícito pelo mesmo motivo do listSets(): sem ele, a ordem
// seguiria o locale da máquina que roda o build.
const sorted = [...cycles].sort(
  (a, b) =>
    a.name.pt.localeCompare(b.name.pt, "pt") ||
    (a.year ?? 0) - (b.year ?? 0) ||
    (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
);

// O Map guarda a ordem de inserção, e a lista já entra ordenada — as letras
// saem em ordem sem um segundo sort.
const groups = new Map<string, Cycle[]>();
for (const cycle of sorted) {
  const key = initial(cycle.name.pt);
  const list = groups.get(key);
  if (list) list.push(cycle);
  else groups.set(key, [cycle]);
}

export default function CycleIndexPage() {
  return (
    <div className="page-shell py-8">
      <h1 className="font-serif display-2 font-bold">
        <T pt="Índice de ciclos" en="Cycle index" />
      </h1>
      <p className="mt-4 max-w-measure text-body leading-[1.7] text-pretty text-secondary-body">
        <T
          pt={`Os ${cycles.length} ciclos do catálogo, em ordem alfabética do nome em português.`}
          en={`All ${cycles.length} cycles in the catalog, in alphabetical order of their Portuguese name.`}
        />
      </p>
      <Ornament stretch className="mt-6" />

      {[...groups].map(([letter, list]) => (
        <section key={letter} className="mt-8">
          <h2 className="font-serif text-section font-semibold rule-double">
            {letter}
          </h2>
          <ul className="mt-4 gap-8 sm:columns-2 lg:columns-3">
            {list.map((cycle) => (
              <li key={cycle.slug} className="break-inside-avoid py-1.5">
                {/* prefetch={false}: com o padrão, todo link que entra na tela
                    baixa a rota inteira do ciclo (doc da 16.2.10,
                    components/link#prefetch). Rolar esta lista seriam centenas
                    de downloads que ninguém pediu. O preço é o clique daqui
                    esperar a página chegar. */}
                <Link
                  href={`/ciclos/${cycle.slug}`}
                  prefetch={false}
                  className="text-ui font-semibold underline-offset-2 hover:text-gold hover:underline"
                >
                  {/* Nome igual nos dois idiomas vai sem o <T>: dois ramos com
                      o mesmo texto só duplicariam o HTML. */}
                  {cycle.name.en === cycle.name.pt ? (
                    cycle.name.pt
                  ) : (
                    <T pt={cycle.name.pt} en={cycle.name.en} />
                  )}
                </Link>
                <span className="block text-meta text-muted">
                  {cycleSetLine(cycle) ?? (
                    <T pt="Vários sets" en="Multiple sets" />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import type { IndexedCycle } from "@/lib/cyclesIndex";
import { RARITY_LABELS, STRUCTURE_LABELS } from "@/lib/filters";
import { T } from "./T";

// O modo "índice" do catálogo: a mesma lista da galeria sem nenhuma imagem,
// numa linha de 36px. É o que torna 100 itens por página baratos — o card traz
// um leque de 5 miniaturas e 24 deles já são 120 requisições à CDN.
//
// Tabela de verdade, e não uma lista de <div>: aqui o dado É tabular, e o
// <th scope="col"> faz o leitor de tela anunciar a coluna junto de cada célula,
// que é exatamente o gabarito que um índice precisa ter. Uma pilha de links
// leria os cinco campos colados no nome acessível de cada link.
export function CycleIndexTable({ entries }: { entries: IndexedCycle[] }) {
  return (
    // overflow-x-auto contido, e não coluna escondida no telefone: esconder
    // dado num modo que existe para mostrar mais dado seria contraditório. A
    // rolagem mora dentro desta caixa — a página nunca rola para o lado.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-ui">
        <thead>
          <tr className="border-b border-border text-left text-meta font-semibold tracking-[0.14em] text-muted uppercase">
            <th scope="col" className="py-2 pr-4">
              <T pt="Ciclo" en="Cycle" />
            </th>
            <th scope="col" className="py-2 pr-4">
              <T pt="Set" en="Set" />
            </th>
            <th scope="col" className="py-2 pr-4">
              <T pt="Ano" en="Year" />
            </th>
            <th scope="col" className="py-2 pr-4">
              <T pt="Raridade" en="Rarity" />
            </th>
            <th scope="col" className="py-2">
              <T pt="Estrutura" en="Structure" />
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <Row key={entry.slug} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ entry }: { entry: IndexedCycle }) {
  const rarity = entry.rarity ? RARITY_LABELS[entry.rarity] : undefined;
  const structure = entry.structure ? STRUCTURE_LABELS[entry.structure] : undefined;

  return (
    // h-9 = 36px, múltiplo de 4 e acima dos 24x24 da SC 2.5.8 para o alvo do
    // link. hover no <tr> inteiro porque a linha toda é a unidade de leitura,
    // mas quem recebe o foco continua sendo só o link — a linha não é clicável.
    <tr className="h-9 border-b border-border hover:bg-panel last:border-b-0">
      {/* scope="row": o nome é o cabeçalho da linha, e é o que identifica as
          outras quatro células quando lidas fora de ordem. */}
      <th scope="row" className="pr-4 text-left font-normal">
        <Link
          href={`/ciclos/${entry.slug}`}
          className="font-serif font-bold underline-offset-2 hover:text-gold hover:underline"
        >
          <T pt={entry.pt} en={entry.en} />
        </Link>
      </th>
      <td className="pr-4 text-muted">
        {entry.setName ?? <T pt="Vários sets" en="Multiple sets" />}
      </td>
      <td className="pr-4 text-muted tabular-nums">
        {entry.year ?? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">
              <T pt="sem ano" en="no year" />
            </span>
          </>
        )}
      </td>
      <td className="pr-4 text-muted">{rarity && <T {...rarity} />}</td>
      <td className="text-muted">{structure && <T {...structure} />}</td>
    </tr>
  );
}

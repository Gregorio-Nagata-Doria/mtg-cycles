// Audita a medida de linha (caracteres por linha) do corpo de texto, lendo o
// --measure direto do globals.css — não de uma cópia, que envelheceria na
// primeira mudança do token.
//
// Uso: node scripts/audit-medida.mjs   (sai 1 se algum caso reprovar)
//
// ⚠️ A pegadinha que fez o 66ch sugerido pelo diagnóstico ser um fix falso:
// `1ch` é a largura do "0", NÃO a do caractere médio. No IBM Plex Sans o "0"
// avança 0.60em e o caractere médio de texto corrido avança ~0.486em, então
// 1ch vale ~1,23 caracteres. 66ch dariam 84 cpl — praticamente os mesmos 85
// do max-w-[640px] que o token veio substituir.
//
// A constante de 0.486em não é chute: sai da medição do achado #29 do
// DIAGNOSTICO-VISUAL.md (640px de coluna ÷ 85 cpl = 7.53px por caractere a
// 15.5px). Bate com as métricas do Plex Sans (avanço médio de minúscula mais
// espaço fica na faixa 0.48–0.50em). Se um dia a família mudar, é ESTA linha
// que precisa mudar junto — e o número novo tem que ser medido, não estimado.

import { readFileSync } from "node:fs";

const CSS = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

const AVG_EM = 0.486; // largura do caractere médio de texto corrido
const CH_EM = 0.6; // largura do "0" no IBM Plex Sans = 1ch

// Baymard/Ruder pedem 50–75; a WCAG 1.4.8 (AAA, mas é o único número normativo
// que existe para isto) pede ≤80. O alvo do projeto é a faixa apertada, com o
// 80 como teto duro.
const IDEAL_MAX = 75;
const TETO = 80;

const medida = CSS.match(/--measure:\s*([\d.]+)ch/);
if (!medida) throw new Error("--measure não encontrado (ou não está em ch) no globals.css");
const CH = Number(medida[1]);

// Cada caso é um lugar real onde o token está pendurado. `containerPx` é a
// font-size do elemento que CARREGA o max-width — é contra ela que o ch
// resolve, e é o erro mais fácil de cometer aqui: pendurar o token no
// container a 16px e conferir a conta com os 15.5px do parágrafo.
//
// O caso "mobile" é o pior por construção e não pelo que se vê na tela: ele
// supõe a coluna cheia com o corpo menor, o que só acontece numa faixa de
// viewport de 601–639px (abaixo disso a largura de fato é o viewport menos o
// gutter, e a partir de 640px o `sm:` já subiu o corpo para 15.5px). O
// exagero é de propósito — auditoria erra para o lado seguro.
const CASOS = [
  { onde: "/sobre  (token no container)", containerPx: 16, corpoPx: 15.5 },
  { onde: "/sobre  (container, mobile)", containerPx: 16, corpoPx: 14.5 },
  { onde: "home    (token no próprio <p>)", containerPx: 15.5, corpoPx: 15.5 },
  { onde: "home    (<p>, mobile)", containerPx: 14.5, corpoPx: 14.5 },
];

console.log(`--measure: ${CH}ch  (1ch = ${CH_EM}em, caractere médio = ${AVG_EM}em)\n`);
console.log("caso                            largura   cpl   veredito");

let falhas = 0;
for (const { onde, containerPx, corpoPx } of CASOS) {
  const px = CH * CH_EM * containerPx;
  const cpl = px / (corpoPx * AVG_EM);
  const ok = cpl <= TETO;
  if (!ok) falhas++;
  const veredito = cpl <= IDEAL_MAX ? "ok" : ok ? `ok (acima de ${IDEAL_MAX}, sob o teto)` : "FALHA";
  console.log(
    `${onde.padEnd(30)} ${px.toFixed(0).padStart(5)}px  ${cpl.toFixed(1).padStart(5)}  ${veredito}`,
  );
}

console.log(falhas ? `\n${falhas} FALHA(S) — acima de ${TETO} cpl (WCAG 1.4.8)` : "\nTudo passa.");
process.exit(falhas ? 1 : 0);

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

// A escala tipográfica sai do CSS pelo mesmo motivo do --measure: os 15.5px
// e 14.5px que estavam cravados aqui viraram mentira no instante em que o
// lote 8 trocou a escala, e o script continuou dizendo "tudo passa".
const REM = 16; // font-size raiz — nada no projeto a altera
function tokenPx(nome) {
  const chave = "--text-" + nome + ":";
  const i = CSS.indexOf(chave);
  if (i === -1) throw new Error(chave + " não encontrado no globals.css");
  const resto = CSS.slice(i + chave.length);
  const fim = resto.indexOf("rem");
  if (fim === -1) throw new Error(chave + " não está em rem");
  const valor = Number(resto.slice(0, fim).trim());
  if (!valor) throw new Error(chave + " não parseou como número");
  return valor * REM;
}
const BODY = tokenPx("body");
const UI = tokenPx("ui");

// Cada caso é um lugar real onde o token está pendurado. `containerPx` é a
// font-size do elemento que CARREGA o max-width — é contra ela que o ch
// resolve, e é o erro mais fácil de cometer aqui: pendurar o token no
// container a 16px e conferir a conta com os 15.5px do parágrafo.
//
// Os dois casos "mobile" que existiam aqui morreram no lote 8. O corpo de
// leitura deixou de encolher no telefone — era text-[14.5px] sm:text-[15.5px],
// dois valores mágicos a meio ponto um do outro — e passou a ser --text-body
// nas duas larguras. Não foi escolha estética: o degrau imediatamente abaixo
// na escala é --text-ui, e ele NÃO cabe nesta coluna. Quem defende isso é a
// guarda no fim do arquivo, com o número derivado do próprio --measure.
const CASOS = [
  { onde: "/sobre  (token no container)", containerPx: REM, corpoPx: BODY },
  { onde: "home    (token no próprio <p>)", containerPx: BODY, corpoPx: BODY },
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

// Guarda derivada, não opinião: dado o --measure, qual é o menor corpo que
// ainda cabe sob o teto de cpl. Existe para o dia em que alguém baixar um
// parágrafo de leitura um degrau na escala tipográfica.
const MENOR_CORPO = (CH * CH_EM * REM) / (TETO * AVG_EM);
const corpoOk = BODY >= MENOR_CORPO;
if (!corpoOk) falhas++;
console.log("");
console.log(
  `menor corpo que cabe em ${TETO} cpl: ${MENOR_CORPO.toFixed(2)}px` +
    `  |  --text-body ${BODY.toFixed(2)}px  ${corpoOk ? "ok" : "FALHA"}`,
);
console.log(
  `--text-ui (${UI.toFixed(2)}px) nesta coluna daria ` +
    `${((CH * CH_EM * REM) / (UI * AVG_EM)).toFixed(1)} cpl — não serve para leitura`,
);

console.log(falhas ? `\n${falhas} FALHA(S) — acima de ${TETO} cpl (WCAG 1.4.8)` : "\nTudo passa.");
process.exit(falhas ? 1 : 0);

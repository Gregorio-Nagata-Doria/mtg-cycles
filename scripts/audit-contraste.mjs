// Audita o contraste dos tokens de cor contra a WCAG 2.2 AA, lendo os hex
// direto do globals.css — não de uma cópia, que envelheceria na primeira
// mudança de paleta.
//
// Uso: node scripts/audit-contraste.mjs   (sai 1 se algum par reprovar)
//
// ⚠️ --panel-sunken NÃO entra na lista de fundos. Ele existe só como bloco de
// esqueleto no ciclos/loading.tsx e nunca recebe texto; incluí-lo gera dez
// falhas fantasma. O que ele precisa é ser distinguível do --panel que o
// contém — isso é testado à parte, no fim.

import { readFileSync } from "node:fs";

const CSS = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

// Alvo por token: 4.5 = texto normal (SC 1.4.3), 3 = componente de UI e texto
// grande (SC 1.4.11 / 1.4.3). Token ausente daqui é decorativo e não é testado
// — é o caso de --border, --border-card e --chip-border, que não delimitam
// controle nenhum.
const ALVO = {
  foreground: 4.5,
  secondary: 4.5,
  "secondary-body": 4.5,
  muted: 4.5,
  "muted-weak": 4.5,
  gold: 4.5,
  "chip-foreground": 4.5,
  "gold-weak": 3,
  "checkbox-off": 3,
  "border-input": 3,
};

const FUNDOS = ["background", "panel", "input"];

function tokens(re) {
  const bloco = CSS.match(re);
  if (!bloco) throw new Error(`bloco de tema não encontrado: ${re}`);
  return Object.fromEntries(
    [...bloco[1].matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]),
  );
}

const canal = (hex) =>
  [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255);
const linear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luz = (hex) => {
  const [r, g, b] = canal(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const razao = (a, b) => {
  const [x, y] = [luz(a), luz(b)];
  return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2);
};

let falhas = 0;

for (const [nome, t] of [
  ["CLARO", tokens(/:root\s*\{([\s\S]*?)\n\}/)],
  ["ESCURO", tokens(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/)],
]) {
  const fundos = FUNDOS.filter((f) => t[f]);
  console.log(`\n=== ${nome} — pior caso entre ${fundos.map((f) => t[f]).join(" ")} ===`);

  for (const [token, alvo] of Object.entries(ALVO)) {
    if (!t[token]) continue;
    const pior = Math.min(...fundos.map((f) => razao(t[token], t[f])));
    const ok = pior >= alvo;
    if (!ok) falhas++;
    console.log(
      `${token.padEnd(16)} ${t[token]}  ${String(pior).padStart(5)}  alvo ${alvo}  ${ok ? "ok" : "FALHA"}`,
    );
  }

  // Pares que não são token-contra-fundo e por isso escapam do laço acima.
  const extras = [
    ["primary-fg / primary", razao(t["primary-foreground"], t.primary), 4.5],
    ["primary-fg / gold", razao(t["primary-foreground"], t.gold), 4.5, "hover do Button primary"],
    ["panel-sunken / panel", razao(t["panel-sunken"], t.panel), 1.15, "esqueleto visível"],
  ];
  for (const [rotulo, valor, alvo, nota] of extras) {
    const ok = valor >= alvo;
    if (!ok) falhas++;
    console.log(
      `${rotulo.padEnd(21)} ${String(valor).padStart(5)}  alvo ${alvo}  ${ok ? "ok" : "FALHA"}${nota ? `  (${nota})` : ""}`,
    );
  }
}

console.log(falhas ? `\n${falhas} FALHA(S)` : "\nTudo passa.");
process.exit(falhas ? 1 : 0);

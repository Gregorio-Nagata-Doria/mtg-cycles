"use client";

import { T } from "./T";

// Trocar de idioma é só mudar data-lang no <html>: o HTML já traz PT e EN
// (componente <T>) e o CSS esconde um dos dois. Nada de rota nova, navegação
// nem refetch — e o mesmo atributo é lido pelo script inline do layout no
// próximo carregamento, então não pisca.
//
// Atributos não são alcançados por isso. Onde o texto era aria-label e precisa
// traduzir, o padrão é um <span class="sr-only"> com <T> dentro do botão: o
// nome acessível passa a vir do conteúdo, e o ramo escondido está em
// display:none, que a especificação manda ignorar nesse cálculo.

// px/py e não só texto solto: sem preenchimento o alvo dava ~20x20 e PT/EN
// ficam colados, então nem a exceção de espaçamento da SC 2.5.8 salvava.
//
// hover:text-gold e não hover:font-black: trocar o peso remede o rótulo e o
// alvo escapa debaixo do cursor no meio da mira (Fitts).
const labelClass =
  "cursor-pointer rounded-sm px-2 py-1.5 font-bold hover:text-gold";

export function LanguageToggle() {
  function changeLanguage(language: "pt" | "en") {
    const root = document.documentElement;
    root.dataset.lang = language;
    root.lang = language === "pt" ? "pt-BR" : "en";
    localStorage.setItem("lang", language);
  }

  return (
    <>
      <button
        type="button"
        data-lang-btn="pt"
        onClick={() => changeLanguage("pt")}
        className={labelClass}
      >
        PT
        <span className="sr-only">
          <T pt="Mudar para português" en="Switch to Portuguese" />
        </span>
      </button>
      <button
        type="button"
        data-lang-btn="en"
        onClick={() => changeLanguage("en")}
        className={labelClass}
      >
        EN
        <span className="sr-only">
          <T pt="Mudar para inglês" en="Switch to English" />
        </span>
      </button>
    </>
  );
}

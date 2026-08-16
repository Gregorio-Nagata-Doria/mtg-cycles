import type { ReactNode } from "react";

// Emite os dois idiomas no HTML e deixa o CSS esconder o inativo (a regra
// [data-lang] em globals.css). Server component de propósito: é markup puro,
// então funciona dentro de página prerenderizada sem virar client boundary e
// sem precisar de rota [lang] — trocar de idioma não recarrega nem refaz fetch.
//
// O custo é o texto sair duplicado no HTML. São poucos KB por página em brotli,
// contra 951 rotas a mais que um segmento [lang] custaria.
//
// Só serve para conteúdo. Atributo (aria-label, alt, title) não tem como ser
// escondido por CSS — ver o comentário no LanguageToggle.
export function T({ pt, en }: { pt: ReactNode; en: ReactNode }) {
  return (
    <>
      <span data-t="pt">{pt}</span>
      <span data-t="en">{en}</span>
    </>
  );
}

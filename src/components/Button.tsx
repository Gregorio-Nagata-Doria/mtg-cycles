import Link from "next/link";
import type { ReactNode } from "react";

// active:translate-y-px e não uma cor de pressionado: o botão primário já usa
// o token mais escuro no repouso, e qualquer variação de cor para o :active
// baixaria o contraste do rótulo. Um deslocamento de 1px dá o retorno do
// toque sem mexer em contraste nenhum.
const BASE =
  "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-[13.5px] font-medium transition-colors active:translate-y-px";

const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-gold",
  secondary:
    "border border-border-input bg-panel text-foreground hover:border-gold hover:text-gold",
};

export function Button({
  text,
  href,
  variant = "primary",
}: {
  text: ReactNode;
  href?: string;
  variant?: keyof typeof VARIANTS;
}) {
  const className = `${BASE} ${VARIANTS[variant]}`;

  if (href)
    return (
      <Link href={href} className={className}>
        {text}
      </Link>
    );

  return (
    <button type="button" className={className}>
      {text}
    </button>
  );
}

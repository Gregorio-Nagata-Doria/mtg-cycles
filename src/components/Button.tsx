import Link from "next/link";
import type { ReactNode } from "react";

const BASE =
  "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-[13.5px] font-medium transition-colors";

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

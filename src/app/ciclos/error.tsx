"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Ornament } from "@/components/Ornament";
import { T } from "@/components/T";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[640px] flex-1 flex-col items-center justify-center gap-5 px-[22px] py-24 text-center sm:gap-6.5">
      <Ornament rule="w-11 sm:w-16" />

      <h1 className="font-serif text-[34px] leading-[1.05] font-bold sm:text-[46px]">
        <T pt="Algo deu errado" en="Something went wrong" />
      </h1>

      <p className="text-[14.5px] leading-[1.7] text-pretty text-secondary-body sm:text-[15.5px] sm:leading-[1.75]">
        <T
          pt="Não foi possível montar esta parte do catálogo. Pode ter sido passageiro — tente de novo."
          en="This part of the catalog couldn’t be assembled. It may have been temporary — try again."
        />
      </p>

      <button
        type="button"
        onClick={() => unstable_retry()}
        className="rounded-lg border border-border-input bg-panel px-4 py-2 text-[13.5px] text-foreground hover:border-gold hover:text-gold"
      >
        <T pt="tentar de novo" en="try again" />
      </button>

      <Link
        href="/"
        className="text-[13.5px] text-gold underline-offset-2 hover:underline"
      >
        <T pt="voltar para a Ciclopédia" en="back to Ciclopédia" />
      </Link>

      {error.digest && (
        <p className="text-[11.5px] text-muted-weak">
          <T pt="código do erro:" en="error code:" /> {error.digest}
        </p>
      )}

      <Ornament rule="w-11 sm:w-16" />
    </div>
  );
}

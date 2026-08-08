import Link from "next/link";
import { Ornament } from "@/components/Ornament";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[640px] flex-1 flex-col items-center justify-center gap-5 px-[22px] py-24 text-center sm:gap-6.5">
      <Ornament rule="w-11 sm:w-16" />

      <p className="font-serif text-[52px] leading-none text-gold-weak sm:text-[64px]">
        404
      </p>

      <h1 className="font-serif text-[34px] leading-[1.05] font-bold sm:text-[46px]">
        Página não encontrada
      </h1>

      <p className="text-[14.5px] leading-[1.7] text-pretty text-secondary-body sm:text-[15.5px] sm:leading-[1.75]">
        Esta página não existe — ou existia e o endereço mudou. Volte para o
        começo e siga daqui.
      </p>

      <Link
        href="/"
        className="text-[13.5px] text-gold underline-offset-2 hover:underline"
      >
        voltar para a Ciclopédia
      </Link>

      <Ornament rule="w-11 sm:w-16" />
    </div>
  );
}

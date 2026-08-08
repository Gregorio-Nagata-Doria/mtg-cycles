"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";

const labelClass = "font-bold";

export function LanguageToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function changeLanguage(language: string) {}

  return (
    <>
      <label
        onClick={() => changeLanguage("pt")}
        className={`${labelClass} cursor-pointer hover:font-black`}
      >
        PT
      </label>
      <label
        onClick={() => changeLanguage("en")}
        className={`${labelClass} cursor-pointer hover:font-black`}
      >
        EN
      </label>
    </>
  );
}

export function LanguageToggleFallback() {
  return (
    <>
      <span className={labelClass}>PT</span>
      <span className={labelClass}>EN</span>
    </>
  );
}

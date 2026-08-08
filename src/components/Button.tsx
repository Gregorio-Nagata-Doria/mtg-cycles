import Link from "next/link";

export function Button({ text, href }: { text: string; href?: string }) {
  if (href) return <Link href={href}>{text}</Link>;
  return <button>{text}</button>;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// O valor congela no next build: sitemap, robots e o canonical de toda página
// viram arquivo estático. Definir a variável depois do build não conserta nada.
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SITE_URL
) {
  console.warn(
    "\n⚠️  NEXT_PUBLIC_SITE_URL não definida — sitemap, robots e os canonicals vão sair apontando para http://localhost:3000.\n",
  );
}

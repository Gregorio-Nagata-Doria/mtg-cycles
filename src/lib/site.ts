export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// O valor congela no next build: sitemap, robots e os 954 canonicals viram
// arquivo estático. Definir a variável depois do build não conserta nada.
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SITE_URL
) {
  console.warn(
    "\n⚠️  NEXT_PUBLIC_SITE_URL não definida — sitemap, robots e os 954 canonicals vão sair apontando para http://localhost:3000.\n",
  );
}

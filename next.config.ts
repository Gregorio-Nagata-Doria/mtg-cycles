import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 11 MB em 68 .map iam para o deploy. O site é estático — quase não há
  // servidor para errar, então stack trace legível em produção vale pouco.
  // Medido em 2026-08-15: 158 MB de .next antes.
  productionBrowserSourceMaps: false,
  experimental: { serverSourceMaps: false },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cards.scryfall.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

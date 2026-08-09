import type { MetadataRoute } from "next";
import cycles from "@cycles";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/ciclos`, priority: 0.9 },
    { url: `${SITE_URL}/sobre`, priority: 0.5 },
    ...cycles.map((cycle) => ({
      url: `${SITE_URL}/ciclos/${cycle.slug}`,
      priority: 0.7,
    })),
  ];
}

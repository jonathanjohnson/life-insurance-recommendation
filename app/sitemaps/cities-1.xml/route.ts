import { getAllCities } from "@/lib/data";
import {
  absoluteUrl,
  renderSitemap,
  todayIsoDate,
  xmlResponse,
} from "@/lib/seo/sitemap";

export const dynamic = "force-static";
export const revalidate = 86_400;

// MVP cap. Bump (and split into cities-2.xml, etc.) once the data
// pipeline lands the full ~30k cities — the sitemap protocol limit is
// 50k URLs per file, 50MB uncompressed.
const SITEMAP_CITY_LIMIT = 250;

export function GET() {
  const lastmod = todayIsoDate();
  const cities = getAllCities()
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .slice(0, SITEMAP_CITY_LIMIT);

  const urls = cities.map((c) => ({
    loc: absoluteUrl(`/${c.stateSlug}/${c.citySlug}`),
    lastmod,
    changefreq: "monthly" as const,
    priority: c.tier === "A" ? 0.7 : 0.5,
  }));

  return xmlResponse(renderSitemap(urls));
}

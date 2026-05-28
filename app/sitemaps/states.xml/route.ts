import { getAllStates } from "@/lib/data";
import {
  absoluteUrl,
  renderSitemap,
  todayIsoDate,
  xmlResponse,
} from "@/lib/seo/sitemap";

export const dynamic = "force-static";
export const revalidate = 86_400;

export function GET() {
  const lastmod = todayIsoDate();
  const urls = getAllStates().map((s) => ({
    loc: absoluteUrl(`/${s.slug}`),
    lastmod,
    changefreq: "monthly" as const,
    priority: 0.8,
  }));
  return xmlResponse(renderSitemap(urls));
}

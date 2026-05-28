import {
  absoluteUrl,
  renderSitemapIndex,
  todayIsoDate,
  xmlResponse,
} from "@/lib/seo/sitemap";

export const dynamic = "force-static";
export const revalidate = 86_400;

export function GET() {
  const lastmod = todayIsoDate();
  const xml = renderSitemapIndex([
    { loc: absoluteUrl("/sitemaps/states.xml"), lastmod },
    { loc: absoluteUrl("/sitemaps/cities-1.xml"), lastmod },
    { loc: absoluteUrl("/sitemaps/services.xml"), lastmod },
  ]);
  return xmlResponse(xml);
}

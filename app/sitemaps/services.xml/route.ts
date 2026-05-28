import {
  renderSitemap,
  xmlResponse,
} from "@/lib/seo/sitemap";

export const dynamic = "force-static";
export const revalidate = 86_400;

/**
 * Placeholder: service / vertical pages (term-life, install, repair, etc.)
 * land here once /services/* routes are built. Empty <urlset> is valid
 * per the sitemap spec and keeps the index file honest.
 */
export function GET() {
  return xmlResponse(renderSitemap([]));
}

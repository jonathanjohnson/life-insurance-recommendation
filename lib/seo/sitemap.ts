/**
 * XML sitemap helpers. Stay framework-agnostic so the sitemap route
 * handlers can build content with simple string composition.
 *
 * https://www.sitemaps.org/protocol.html
 */

export type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: number;
}

export interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
}

/**
 * XML escape — the sitemap spec requires & < > ' " in <loc> values to
 * be entity-encoded. Our slugs are URL-safe today, but escape defensively.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${getSiteUrl()}${path}`;
}

export function renderSitemap(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const parts = [
        `    <loc>${escapeXml(u.loc)}</loc>`,
        u.lastmod ? `    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : null,
        u.changefreq
          ? `    <changefreq>${u.changefreq}</changefreq>`
          : null,
        u.priority !== undefined
          ? `    <priority>${u.priority.toFixed(1)}</priority>`
          : null,
      ].filter(Boolean);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function renderSitemapIndex(entries: SitemapIndexEntry[]): string {
  const body = entries
    .map((e) => {
      const parts = [
        `    <loc>${escapeXml(e.loc)}</loc>`,
        e.lastmod ? `    <lastmod>${escapeXml(e.lastmod)}</lastmod>` : null,
      ].filter(Boolean);
      return `  <sitemap>\n${parts.join("\n")}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

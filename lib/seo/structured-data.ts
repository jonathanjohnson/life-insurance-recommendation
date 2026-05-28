/**
 * Site-wide structured data builders that don't belong to a single page
 * template. WebSite goes on the homepage; the rest live in lib/seo/schema.ts.
 */
import { getSiteUrl } from "./sitemap";

const SITE_NAME = "HVAC Pros Network";

export function buildWebSiteSchema() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/find-pros?zip={zip_query}`,
      "query-input": "required name=zip_query",
    },
  };
}

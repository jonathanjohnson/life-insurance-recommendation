import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/sitemap";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /find-pros is a conversion landing zone, not crawlable content.
        // /api/* is JSON only. The Next 404/500 routes are reserved.
        disallow: ["/api/", "/find-pros", "/404", "/500"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

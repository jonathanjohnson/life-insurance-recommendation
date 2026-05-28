/**
 * schema.org JSON-LD builders. Each returns a fully-formed object with
 * @context and @type — pass them straight into <SchemaInjector schemas>.
 *
 * `SITE_URL` falls back to localhost so tests / build-time prerenders work
 * without env config; real deploys must set NEXT_PUBLIC_SITE_URL.
 */
import type { City } from "@/lib/data/types";

const SITE_NAME = "HVAC Pros Network";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
const SUPPORT_PHONE = "+1-800-482-2776";

function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

export interface OrgSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  contactPoint: object;
}

export function buildOrganizationSchema(): OrgSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.png"),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SUPPORT_PHONE,
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: ["en"],
    },
  };
}

export interface ServiceSchemaOpts {
  name: string;
  /** Free text ("United States") or a structured Place node. */
  areaServed: string | object;
  serviceType: string;
  description?: string;
  /** Page URL to anchor the Service node. */
  url?: string;
}

export function buildServiceSchema(opts: ServiceSchemaOpts) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    serviceType: opts.serviceType,
    areaServed: opts.areaServed,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.url ? { url: absoluteUrl(opts.url) } : {}),
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      telephone: SUPPORT_PHONE,
    },
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

export function buildFAQSchema(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/**
 * LocalBusiness node representing the directory page for one city. Google
 * accepts this for service-area sites as long as the entity is clearly a
 * service aggregator, not a brick-and-mortar location.
 */
export function buildLocalBusinessAggregatorSchema(city: City) {
  const path = `/${city.stateSlug}/${city.citySlug}`;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": absoluteUrl(path),
    name: `${SITE_NAME} — ${city.cityName}, ${city.stateAbbr}`,
    url: absoluteUrl(path),
    telephone: SUPPORT_PHONE,
    image: absoluteUrl("/og-default.png"),
    address: {
      "@type": "PostalAddress",
      addressLocality: city.cityName,
      addressRegion: city.stateAbbr,
      postalCode: city.primary_zip || undefined,
      addressCountry: "US",
    },
    ...(city.lat && city.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: city.lat,
            longitude: city.lng,
          },
        }
      : {}),
    areaServed: {
      "@type": "City",
      name: city.cityName,
      ...(city.lat && city.lng
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: city.lat,
              longitude: city.lng,
            },
          }
        : {}),
    },
    priceRange: "$$",
  };
}

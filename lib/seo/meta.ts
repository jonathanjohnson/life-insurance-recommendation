/**
 * Next.js Metadata API builders for the three page types.
 *
 * City metadata is tier-keyed (A/B/C, set by the data pipeline based on
 * national population rank) so high-priority cities get tighter titles
 * and descriptions while the long tail uses a region-agnostic template.
 *
 * Every helper returns absolute canonical/og URLs via `metadataBase`
 * (configured in app/layout.tsx); the strings here stay relative.
 */
import type { Metadata } from "next";
import type { City, State } from "@/lib/data/types";

const SITE_NAME = "HVAC Pros Network";
const OG_IMAGE = "/og-default.png";

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function shared(title: string, description: string, canonical: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

export function buildCountryMeta(): Metadata {
  const title = `${SITE_NAME} | Find Local HVAC Contractors`;
  const description =
    "Compare local HVAC contractors and get matched with licensed technicians in your area. Free quotes for repair, replacement, and maintenance.";
  return shared(title, description, "/");
}

export function buildStateMeta(state: State): Metadata {
  const title = `HVAC Contractors in ${state.name} | Compare Local Pros`;
  const cityCount = state.cityCount;
  const description = cityCount
    ? `Find licensed HVAC contractors across ${state.name}. Free quotes for repair, replacement, and maintenance. Coverage in ${cityCount} cities.`
    : `Find licensed HVAC contractors across ${state.name}. Free quotes for repair, replacement, and maintenance. Statewide coverage.`;
  return shared(title, description, `/${state.slug}`);
}

export function buildCityMeta(city: City, state: State): Metadata {
  const repairMedian = city.pricing?.repair.median
    ? fmtMoney.format(city.pricing.repair.median)
    : null;
  const canonical = `/${city.stateSlug}/${city.citySlug}`;

  let title: string;
  let description: string;

  if (city.tier === "A") {
    title = `HVAC in ${city.cityName}, ${city.stateAbbr} | Free Quotes from Local Pros`;
    description = repairMedian
      ? `Compare HVAC contractors in ${city.cityName}. Get free quotes from licensed local pros. Avg repair cost ${repairMedian}. Same-day service available.`
      : `Compare HVAC contractors in ${city.cityName}. Get free quotes from licensed local pros. Same-day service available.`;
  } else if (city.tier === "B") {
    title = `${city.cityName}, ${city.stateAbbr} HVAC Contractors | Compare Top-Rated Pros`;
    description = repairMedian
      ? `Find HVAC services in ${city.cityName}, ${state.name}. Free quotes, licensed contractors, average ${repairMedian} repair cost.`
      : `Find HVAC services in ${city.cityName}, ${state.name}. Free quotes from licensed contractors.`;
  } else {
    title = `HVAC Near ${city.cityName}, ${city.stateAbbr} | Trusted Local Pros`;
    description = repairMedian
      ? `Trusted HVAC contractors serving ${city.cityName}, ${state.name}. Licensed pros for repair, replacement, and maintenance. Avg repair ${repairMedian}.`
      : `Trusted HVAC contractors serving ${city.cityName}, ${state.name}. Licensed pros for repair, replacement, and maintenance.`;
  }

  return shared(title, description, canonical);
}

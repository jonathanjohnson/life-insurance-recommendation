import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityPage } from "@/components/pages/CityPage";
import { generateCityContent } from "@/lib/content/variants";
import {
  getAllCities,
  getCityBySlug,
  getNearestCities,
  getStateBySlug,
} from "@/lib/data";
import { buildCityMeta } from "@/lib/seo/meta";

type RouteParams = Promise<{ state: string; city: string }>;

// ISR: pages outside the top-250 prerender list are generated on first
// request and cached for 24h.
export const dynamicParams = true;
export const revalidate = 86_400;

const PRERENDER_LIMIT = 250;

export function generateStaticParams() {
  return getAllCities()
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .slice(0, PRERENDER_LIMIT)
    .map((c) => ({ state: c.stateSlug, city: c.citySlug }));
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const city = getCityBySlug(stateSlug, citySlug);
  if (!city) return {};
  const state = getStateBySlug(city.stateSlug);
  if (!state) return {};
  return buildCityMeta(city, state);
}

export default async function CityRoute({ params }: { params: RouteParams }) {
  const { state: stateSlug, city: citySlug } = await params;

  const city = getCityBySlug(stateSlug, citySlug);
  if (!city) notFound();

  const state = getStateBySlug(city.stateSlug);
  if (!state) notFound();

  const nearestCities = getNearestCities(city, 12);
  const content = generateCityContent(city);

  return (
    <CityPage
      city={city}
      state={state}
      nearestCities={nearestCities}
      content={content}
    />
  );
}

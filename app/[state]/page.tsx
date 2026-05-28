import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatePage } from "@/components/pages/StatePage";
import {
  getAllStates,
  getCitiesByState,
  getStateBySlug,
} from "@/lib/data";
import { buildStateMeta } from "@/lib/seo/meta";

type RouteParams = Promise<{ state: string }>;

export const dynamic = "error";
// Unknown state slugs return 404 immediately rather than triggering ISR.
// `dynamic: "error"` only catches dynamic API usage at build time; the
// 404 behavior for unknown params comes from `dynamicParams: false`.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllStates().map((s) => ({ state: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) return {};
  return buildStateMeta(state);
}

export default async function StateRoute({ params }: { params: RouteParams }) {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) notFound();

  const cities = getCitiesByState(stateSlug).slice(0, 50);

  return <StatePage state={state} cities={cities} />;
}

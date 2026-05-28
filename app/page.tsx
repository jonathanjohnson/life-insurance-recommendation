import type { Metadata } from "next";
import { CountryPage } from "@/components/pages/CountryPage";
import { getAllStates, getTopCitiesNationally } from "@/lib/data";
import { buildCountryMeta } from "@/lib/seo/meta";

export const dynamic = "error";

export const metadata: Metadata = buildCountryMeta();

export default function HomePage() {
  return (
    <CountryPage
      topCities={getTopCitiesNationally(20)}
      topStates={getAllStates()}
    />
  );
}

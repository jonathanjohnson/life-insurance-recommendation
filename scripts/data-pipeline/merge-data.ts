/**
 * merge-data.ts
 *
 * Merges SimpleMaps base + Census + NOAA + Pricing caches into:
 *   - /lib/data/cities.json          full city records
 *   - /lib/data/states.json          50-state aggregates
 *   - /lib/data/cities-by-state.json state slug → ordered city slugs
 *
 * Tiering: A = top 100 by population, B = 101-1000, C = the rest.
 *
 * Usage:
 *   tsx scripts/data-pipeline/merge-data.ts [--limit N] [--min-population N]
 */
import path from "node:path";
import type { CensusCache } from "./fetch-census";
import type { ClimateCache } from "./fetch-noaa";
import type { CityPricing, PricingCache } from "./generate-pricing";
import { loadRawCities, parseArgs, type RawCity } from "./lib/cities";
import { readJson, writeJson } from "./lib/json";
import { info } from "./lib/log";
import { slugify } from "./lib/slug";

const CENSUS_FILE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/census-data.json",
);
const CLIMATE_FILE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/climate-data.json",
);
const PRICING_FILE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/pricing-data.json",
);
const CITIES_OUT = path.join(process.cwd(), "lib/data/cities.json");
const STATES_OUT = path.join(process.cwd(), "lib/data/states.json");
const CITIES_BY_STATE_OUT = path.join(
  process.cwd(),
  "lib/data/cities-by-state.json",
);

export type CityRecord = {
  slug: string;
  citySlug: string;
  cityName: string;
  stateName: string;
  stateSlug: string;
  stateAbbr: string;
  county: string;
  lat: number;
  lng: number;
  population: number;
  density: number;
  zips: string[];
  primary_zip: string;
  housing: {
    medianHomeValue: number | null;
    medianIncome: number | null;
    totalUnits: number | null;
  };
  climate: {
    avgHigh: number | null;
    avgLow: number | null;
    annualPrecip: number | null;
    daysOver90: number | null;
    daysUnder32: number | null;
    stationId: string | null;
    stationDistanceMiles: number | null;
  };
  pricing: CityPricing | null;
  tier: "A" | "B" | "C";
  rank: number;
};

export type StateRecord = {
  slug: string;
  name: string;
  abbr: string;
  cityCount: number;
  totalPopulation: number;
  topCity: { slug: string; name: string; population: number } | null;
  avgMedianHomeValue: number | null;
  avgDaysOver90: number | null;
  avgDaysUnder32: number | null;
};

function tierFor(rank: number): "A" | "B" | "C" {
  if (rank <= 100) return "A";
  if (rank <= 1000) return "B";
  return "C";
}

function avg(values: (number | null | undefined)[]): number | null {
  const nums = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function buildCityRecord(
  city: RawCity,
  rank: number,
  census: CensusCache,
  climate: ClimateCache,
  pricing: PricingCache,
): CityRecord {
  const c = census[city.citySlug];
  const cl = climate[city.citySlug];
  const p = pricing[city.citySlug];

  return {
    slug: city.citySlug,
    citySlug: city.citySlug,
    cityName: city.city,
    stateName: city.stateName,
    stateSlug: city.stateSlug,
    stateAbbr: city.stateId,
    county: city.countyName,
    lat: city.lat,
    lng: city.lng,
    population: city.population,
    density: city.density,
    zips: city.zips,
    primary_zip: city.zips[0] ?? "",
    housing: {
      medianHomeValue: c?.medianHomeValue ?? null,
      medianIncome: c?.medianHouseholdIncome ?? null,
      totalUnits: c?.totalHousingUnits ?? null,
    },
    climate: {
      avgHigh: cl?.avgHighF ?? null,
      avgLow: cl?.avgLowF ?? null,
      annualPrecip: cl?.annualPrecipIn ?? null,
      daysOver90: cl?.daysOver90 ?? null,
      daysUnder32: cl?.daysUnder32 ?? null,
      stationId: cl?.stationId ?? null,
      stationDistanceMiles: cl?.stationDistanceMiles ?? null,
    },
    pricing: p ?? null,
    tier: tierFor(rank),
    rank,
  };
}

export async function mergeData(opts: {
  limit?: number;
  minPopulation?: number;
}): Promise<{ cities: CityRecord[]; states: StateRecord[] }> {
  const cities = await loadRawCities({
    limit: opts.limit,
    minPopulation: opts.minPopulation,
  });
  const census = await readJson<CensusCache>(CENSUS_FILE, {});
  const climate = await readJson<ClimateCache>(CLIMATE_FILE, {});
  const pricing = await readJson<PricingCache>(PRICING_FILE, {});

  // Population rank determines tier — recompute from the loaded slice so a
  // --limit run still tiers consistently.
  const records: CityRecord[] = cities.map((city, idx) =>
    buildCityRecord(city, idx + 1, census, climate, pricing),
  );

  await writeJson(CITIES_OUT, records);
  info(`cities.json: ${records.length} records → ${CITIES_OUT}`);

  // State aggregates from the merged records (so the numbers reflect what
  // actually ships to the site, not the raw CSV).
  const byState = new Map<string, CityRecord[]>();
  for (const r of records) {
    const arr = byState.get(r.stateAbbr) ?? [];
    arr.push(r);
    byState.set(r.stateAbbr, arr);
  }

  const states: StateRecord[] = Array.from(byState.entries())
    .map(([abbr, cs]): StateRecord => {
      const sorted = [...cs].sort((a, b) => b.population - a.population);
      const top = sorted[0];
      return {
        slug: slugify(top.stateName),
        name: top.stateName,
        abbr,
        cityCount: cs.length,
        totalPopulation: cs.reduce((sum, c) => sum + c.population, 0),
        topCity: top
          ? { slug: top.slug, name: top.cityName, population: top.population }
          : null,
        avgMedianHomeValue: avg(cs.map((c) => c.housing.medianHomeValue)),
        avgDaysOver90: avg(cs.map((c) => c.climate.daysOver90)),
        avgDaysUnder32: avg(cs.map((c) => c.climate.daysUnder32)),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  await writeJson(STATES_OUT, states);
  info(`states.json: ${states.length} records → ${STATES_OUT}`);

  const citiesByState: Record<string, string[]> = {};
  for (const [, cs] of byState) {
    const sorted = [...cs].sort((a, b) => b.population - a.population);
    const key = sorted[0].stateSlug;
    citiesByState[key] = sorted.map((c) => c.slug);
  }

  await writeJson(CITIES_BY_STATE_OUT, citiesByState);
  info(
    `cities-by-state.json: ${Object.keys(citiesByState).length} states → ${CITIES_BY_STATE_OUT}`,
  );

  return { cities: records, states };
}

if (process.argv[1] && process.argv[1].endsWith("merge-data.ts")) {
  const args = parseArgs(process.argv.slice(2));
  mergeData(args).catch((err: unknown) => {
    if (err instanceof Error) console.error(err.message);
    process.exit(1);
  });
}

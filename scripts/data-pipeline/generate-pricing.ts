/**
 * generate-pricing.ts
 *
 * Deterministic per-city HVAC pricing derived from Census + NOAA caches.
 *
 *   Base ranges (USD)              low   median   high
 *     repair                        200   325      450
 *     install                      4500  6500    11000
 *     maintenance                    90   140      225
 *     emergency                     275   425      650
 *
 *   Adjustments
 *     cost-of-living = clamp(medianHomeValue / 268000, 0.7, 1.6)
 *     ac surcharge   = +15% on repair + emergency if daysOver90 > 100
 *     heat surcharge = +15% on repair + emergency if daysUnder32 > 60
 *
 * No network. Reads census-data.json and climate-data.json from output/.
 *
 * Usage:
 *   tsx scripts/data-pipeline/generate-pricing.ts [--force] [--limit N]
 */
import path from "node:path";
import type { CensusCache } from "./fetch-census";
import type { ClimateCache } from "./fetch-noaa";
import { loadRawCities, parseArgs } from "./lib/cities";
import { readJson, writeJson } from "./lib/json";
import { error, info } from "./lib/log";

const CENSUS_FILE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/census-data.json",
);
const CLIMATE_FILE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/climate-data.json",
);
const OUTPUT_FILE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/pricing-data.json",
);

export type PricingTier = { low: number; median: number; high: number };
export type CityPricing = {
  repair: PricingTier;
  install: PricingTier;
  maintenance: PricingTier;
  emergency: PricingTier;
  costOfLivingFactor: number;
  acSurcharge: boolean;
  heatSurcharge: boolean;
};
export type PricingCache = Record<string, CityPricing>;

const NATIONAL_MEDIAN_HOME_VALUE = 268_000;
const BASE: Record<keyof Omit<CityPricing, "costOfLivingFactor" | "acSurcharge" | "heatSurcharge">, PricingTier> = {
  repair: { low: 200, median: 325, high: 450 },
  install: { low: 4500, median: 6500, high: 11000 },
  maintenance: { low: 90, median: 140, high: 225 },
  emergency: { low: 275, median: 425, high: 650 },
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function scaleTier(tier: PricingTier, factor: number): PricingTier {
  const round = (n: number) => Math.round(n / 5) * 5;
  return {
    low: round(tier.low * factor),
    median: round(tier.median * factor),
    high: round(tier.high * factor),
  };
}

export function priceCity(
  medianHomeValue: number | null,
  daysOver90: number | null,
  daysUnder32: number | null,
): CityPricing {
  const colFactor = medianHomeValue
    ? clamp(medianHomeValue / NATIONAL_MEDIAN_HOME_VALUE, 0.7, 1.6)
    : 1;
  const acSurcharge = (daysOver90 ?? 0) > 100;
  const heatSurcharge = (daysUnder32 ?? 0) > 60;
  const climateBump =
    1 + (acSurcharge ? 0.15 : 0) + (heatSurcharge ? 0.15 : 0);

  return {
    repair: scaleTier(BASE.repair, colFactor * climateBump),
    install: scaleTier(BASE.install, colFactor),
    maintenance: scaleTier(BASE.maintenance, colFactor),
    emergency: scaleTier(BASE.emergency, colFactor * climateBump),
    costOfLivingFactor: Number(colFactor.toFixed(3)),
    acSurcharge,
    heatSurcharge,
  };
}

export async function generatePricing(opts: {
  force?: boolean;
  limit?: number;
  minPopulation?: number;
}): Promise<PricingCache> {
  const cities = await loadRawCities({
    limit: opts.limit,
    minPopulation: opts.minPopulation,
  });
  const census = await readJson<CensusCache>(CENSUS_FILE, {});
  const climate = await readJson<ClimateCache>(CLIMATE_FILE, {});
  const cache: PricingCache = opts.force
    ? {}
    : await readJson<PricingCache>(OUTPUT_FILE, {});

  let computed = 0;
  for (const city of cities) {
    if (!opts.force && cache[city.citySlug]) continue;
    const c = census[city.citySlug];
    const cl = climate[city.citySlug];
    cache[city.citySlug] = priceCity(
      c?.medianHomeValue ?? null,
      cl?.daysOver90 ?? null,
      cl?.daysUnder32 ?? null,
    );
    computed++;
  }

  await writeJson(OUTPUT_FILE, cache);
  info(`Pricing: computed ${computed} new entries (${Object.keys(cache).length} total)`);
  return cache;
}

if (process.argv[1] && process.argv[1].endsWith("generate-pricing.ts")) {
  const args = parseArgs(process.argv.slice(2));
  generatePricing(args).catch((err) => {
    error("generate-pricing fatal", err);
    process.exit(1);
  });
}

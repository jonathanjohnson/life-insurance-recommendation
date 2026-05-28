/**
 * fetch-census.ts
 *
 * One HTTP request per US state to the ACS 5-year (2022) "places" endpoint.
 * Resolves each SimpleMaps city to a Census place by normalized name match
 * within the same state. Cached output keyed by city_slug.
 *
 * Variables:
 *   B25077_001E  median home value
 *   B19013_001E  median household income
 *   B25001_001E  total housing units
 *
 * Usage:
 *   tsx scripts/data-pipeline/fetch-census.ts [--force] [--limit N] [--min-population N]
 */
import path from "node:path";
import { loadRawCities, parseArgs, type RawCity } from "./lib/cities";
import { readJson, writeJson } from "./lib/json";
import { error, info, progress, warn } from "./lib/log";
import { slugify } from "./lib/slug";
import { STATES, stateByAbbr } from "./lib/states";

type CensusCityRow = {
  geoid: string;
  placeName: string;
  medianHomeValue: number | null;
  medianHouseholdIncome: number | null;
  totalHousingUnits: number | null;
  fetchedAt: string;
};

export type CensusCache = Record<string, CensusCityRow>;

const OUTPUT_FILE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/census-data.json",
);
const CENSUS_VARS = ["B25077_001E", "B19013_001E", "B25001_001E"];
const CENSUS_BASE = "https://api.census.gov/data/2022/acs/acs5";

type CensusPlaceRow = {
  name: string;
  geoid: string;
  values: Record<string, number | null>;
};

/**
 * Census ACS places endpoint returns:
 * [["NAME","B25077_001E",...,"state","place"], ["Foo city, X", "123",...,"01","12345"]]
 * Names look like "Springfield city, Missouri" or "Lake Worth Beach city, Florida".
 */
async function fetchPlacesForState(
  stateFips: string,
  apiKey: string,
): Promise<CensusPlaceRow[]> {
  const url = new URL(CENSUS_BASE);
  url.searchParams.set("get", ["NAME", ...CENSUS_VARS].join(","));
  url.searchParams.set("for", "place:*");
  url.searchParams.set("in", `state:${stateFips}`);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Census API ${res.status}: ${await res.text()}`);
  }
  const raw = (await res.json()) as string[][];
  const [header, ...body] = raw;
  const idx = (col: string) => header.indexOf(col);
  const nameI = idx("NAME");
  const stateI = idx("state");
  const placeI = idx("place");

  return body.map((row): CensusPlaceRow => {
    const values: Record<string, number | null> = {};
    for (const v of CENSUS_VARS) {
      const raw = row[idx(v)];
      const n = raw == null || raw === "" ? null : Number(raw);
      values[v] = Number.isFinite(n) && n !== null && n >= 0 ? n : null;
    }
    return {
      name: row[nameI] ?? "",
      geoid: `${row[stateI]}${row[placeI]}`,
      values,
    };
  });
}

/**
 * Census place names are of the form "Foo city, Bar state" or "Foo town, ...".
 * Reduce to slugified core for matching.
 */
function normalizeCensusName(placeName: string): string {
  const cityPart = placeName.split(",")[0] ?? placeName;
  const stripped = cityPart.replace(
    /\s+(city|town|village|borough|CDP|municipality)$/i,
    "",
  );
  return slugify(stripped);
}

function buildLookup(places: CensusPlaceRow[]): Map<string, CensusPlaceRow> {
  const m = new Map<string, CensusPlaceRow>();
  for (const p of places) {
    const key = normalizeCensusName(p.name);
    if (!m.has(key)) m.set(key, p);
  }
  return m;
}

export async function fetchCensus(opts: {
  force?: boolean;
  limit?: number;
  minPopulation?: number;
}): Promise<CensusCache> {
  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing CENSUS_API_KEY env var. Get a free key at https://api.census.gov/data/key_signup.html",
    );
  }

  const cities = await loadRawCities({
    limit: opts.limit,
    minPopulation: opts.minPopulation,
  });
  const cache: CensusCache = opts.force
    ? {}
    : await readJson<CensusCache>(OUTPUT_FILE, {});

  const byState = new Map<string, RawCity[]>();
  for (const c of cities) {
    if (!opts.force && cache[c.citySlug]) continue;
    const arr = byState.get(c.stateId) ?? [];
    arr.push(c);
    byState.set(c.stateId, arr);
  }

  const stateAbbrs = Array.from(byState.keys());
  info(
    `Census: ${cities.length} cities total, ${stateAbbrs.length} states to query (cached: ${Object.keys(cache).length})`,
  );

  let processed = 0;
  for (const abbr of stateAbbrs) {
    const meta = stateByAbbr(abbr);
    if (!meta) {
      warn(`Unknown state abbr ${abbr}, skipping`);
      continue;
    }
    let places: CensusPlaceRow[];
    try {
      places = await fetchPlacesForState(meta.fips, apiKey);
    } catch (err) {
      error(`Census fetch failed for ${meta.name}`, err);
      continue;
    }
    const lookup = buildLookup(places);

    const stateCities = byState.get(abbr) ?? [];
    for (const city of stateCities) {
      const key = slugify(city.cityAscii || city.city);
      const match = lookup.get(key);
      if (!match) {
        warn(`No Census place match for ${city.city}, ${city.stateId}`);
        continue;
      }
      cache[city.citySlug] = {
        geoid: match.geoid,
        placeName: match.name,
        medianHomeValue: match.values.B25077_001E,
        medianHouseholdIncome: match.values.B19013_001E,
        totalHousingUnits: match.values.B25001_001E,
        fetchedAt: new Date().toISOString(),
      };
    }
    processed++;
    progress(processed, stateAbbrs.length, "Census states");
    await writeJson(OUTPUT_FILE, cache);
  }

  info(`Census: cache now has ${Object.keys(cache).length} cities`);
  return cache;
}

if (process.argv[1] && process.argv[1].endsWith("fetch-census.ts")) {
  const args = parseArgs(process.argv.slice(2));
  // Touch STATES to keep tree-shaking honest.
  void STATES;
  fetchCensus(args).catch((err) => {
    error("fetch-census fatal", err);
    process.exit(1);
  });
}

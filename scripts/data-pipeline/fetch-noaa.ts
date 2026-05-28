/**
 * fetch-noaa.ts
 *
 * For each city, find the closest GHCND station with 1991-2020 annual
 * climate normals and pull the headline numbers. Stations are cached
 * locally so we only hit the /stations endpoint once per pipeline run.
 *
 * Datatypes (NCEI CDO v2, dataset NORMAL_ANN):
 *   ANN-TMAX-NORMAL   annual mean of daily max temp (°F * 10)
 *   ANN-TMIN-NORMAL   annual mean of daily min temp (°F * 10)
 *   ANN-PRCP-NORMAL   annual precipitation (inches * 100)
 *   ANN-TMAX-AVGNDS-GRTH090  avg # days/year with max >= 90°F
 *   ANN-TMIN-AVGNDS-LSTH032  avg # days/year with min <= 32°F
 *
 * NCEI rate-limits to 5 req/sec, 10000/day. We dedupe by station first
 * (many cities share a station) and persist per-station + per-city caches.
 *
 * Usage:
 *   tsx scripts/data-pipeline/fetch-noaa.ts [--force] [--limit N] [--radius MILES]
 */
import path from "node:path";
import { loadRawCities, parseArgs, type RawCity } from "./lib/cities";
import { haversineMiles } from "./lib/geo";
import { readJson, writeJson } from "./lib/json";
import { error, info, progress, warn } from "./lib/log";

const OUTPUT_FILE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/climate-data.json",
);
const STATIONS_CACHE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/.noaa-stations.json",
);
const STATION_NORMALS_CACHE = path.join(
  process.cwd(),
  "scripts/data-pipeline/output/.noaa-normals.json",
);

const NCEI_BASE = "https://www.ncei.noaa.gov/cdo-web/api/v2";
const DATASET = "NORMAL_ANN";
const DATATYPES = [
  "ANN-TMAX-NORMAL",
  "ANN-TMIN-NORMAL",
  "ANN-PRCP-NORMAL",
  "ANN-TMAX-AVGNDS-GRTH090",
  "ANN-TMIN-AVGNDS-LSTH032",
];

type NceiStation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  mindate?: string;
  maxdate?: string;
};

type StationNormals = {
  avgHighF: number | null;
  avgLowF: number | null;
  annualPrecipIn: number | null;
  daysOver90: number | null;
  daysUnder32: number | null;
  fetchedAt: string;
};

type CityClimate = StationNormals & {
  stationId: string;
  stationName: string;
  stationDistanceMiles: number;
};

export type ClimateCache = Record<string, CityClimate>;

type StationsCache = { fetchedAt: string; stations: NceiStation[] };
type NormalsCache = Record<string, StationNormals>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function nceiRequest<T>(
  endpoint: string,
  params: Record<string, string>,
  token: string,
): Promise<T> {
  const url = new URL(`${NCEI_BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { token } });
    if (res.status === 429) {
      await sleep(2000 * attempt);
      continue;
    }
    if (!res.ok) {
      throw new Error(`NCEI ${endpoint} ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  }
  throw new Error(`NCEI ${endpoint} rate-limited after retries`);
}

/**
 * Pull every NORMAL_ANN station once, paginated. The full list is small
 * enough (~9k stations nationally) to keep in memory for distance lookups.
 */
async function loadAllStations(token: string): Promise<NceiStation[]> {
  const cached = await readJson<StationsCache | null>(STATIONS_CACHE, null);
  if (cached && cached.stations.length > 0) {
    info(`NOAA: using ${cached.stations.length} cached stations`);
    return cached.stations;
  }

  const all: NceiStation[] = [];
  let offset = 1;
  const limit = 1000;
  for (;;) {
    type Resp = {
      metadata: { resultset: { count: number; offset: number; limit: number } };
      results: NceiStation[];
    };
    const page = await nceiRequest<Resp>(
      "/stations",
      {
        datasetid: DATASET,
        limit: String(limit),
        offset: String(offset),
      },
      token,
    );
    const results = page.results ?? [];
    all.push(...results);
    if (results.length < limit) break;
    offset += limit;
    await sleep(250);
  }

  await writeJson(STATIONS_CACHE, {
    fetchedAt: new Date().toISOString(),
    stations: all,
  } satisfies StationsCache);
  info(`NOAA: cached ${all.length} stations`);
  return all;
}

function closestStation(
  city: RawCity,
  stations: NceiStation[],
  maxRadiusMiles: number,
): { station: NceiStation; distance: number } | null {
  let best: { station: NceiStation; distance: number } | null = null;
  for (const s of stations) {
    const d = haversineMiles(city.lat, city.lng, s.latitude, s.longitude);
    if (d > maxRadiusMiles) continue;
    if (!best || d < best.distance) best = { station: s, distance: d };
  }
  return best;
}

async function fetchStationNormals(
  stationId: string,
  token: string,
): Promise<StationNormals> {
  type Resp = {
    results?: { datatype: string; value: number }[];
  };
  const data = await nceiRequest<Resp>(
    "/data",
    {
      datasetid: DATASET,
      stationid: stationId,
      datatypeid: DATATYPES.join(","),
      startdate: "2010-01-01",
      enddate: "2010-01-01",
      units: "standard",
      limit: "100",
    },
    token,
  );
  const byType = new Map<string, number>();
  for (const r of data.results ?? []) byType.set(r.datatype, r.value);

  // ANN-TMAX-NORMAL / ANN-TMIN-NORMAL come back in tenths of °F.
  const tenths = (v: number | undefined) =>
    v === undefined ? null : v / 10;
  const hundredths = (v: number | undefined) =>
    v === undefined ? null : v / 100;

  return {
    avgHighF: tenths(byType.get("ANN-TMAX-NORMAL")),
    avgLowF: tenths(byType.get("ANN-TMIN-NORMAL")),
    annualPrecipIn: hundredths(byType.get("ANN-PRCP-NORMAL")),
    daysOver90: byType.get("ANN-TMAX-AVGNDS-GRTH090") ?? null,
    daysUnder32: byType.get("ANN-TMIN-AVGNDS-LSTH032") ?? null,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchNoaa(opts: {
  force?: boolean;
  limit?: number;
  minPopulation?: number;
  radiusMiles?: number;
}): Promise<ClimateCache> {
  const token = process.env.NOAA_API_TOKEN;
  if (!token) {
    throw new Error(
      "Missing NOAA_API_TOKEN env var. Request one at https://www.ncdc.noaa.gov/cdo-web/token",
    );
  }
  const radiusMiles = opts.radiusMiles ?? 50;

  const cities = await loadRawCities({
    limit: opts.limit,
    minPopulation: opts.minPopulation,
  });
  const cache: ClimateCache = opts.force
    ? {}
    : await readJson<ClimateCache>(OUTPUT_FILE, {});
  const normalsCache: NormalsCache = opts.force
    ? {}
    : await readJson<NormalsCache>(STATION_NORMALS_CACHE, {});

  const stations = await loadAllStations(token);
  const todo = cities.filter((c) => opts.force || !cache[c.citySlug]);
  info(
    `NOAA: ${todo.length} cities to resolve (cached: ${Object.keys(cache).length})`,
  );

  let processed = 0;
  for (const city of todo) {
    const match = closestStation(city, stations, radiusMiles);
    if (!match) {
      warn(`No NOAA station within ${radiusMiles}mi of ${city.city}, ${city.stateId}`);
      processed++;
      continue;
    }
    try {
      let normals = normalsCache[match.station.id];
      if (!normals) {
        normals = await fetchStationNormals(match.station.id, token);
        normalsCache[match.station.id] = normals;
        await writeJson(STATION_NORMALS_CACHE, normalsCache);
        await sleep(220); // ~4.5 req/s
      }
      cache[city.citySlug] = {
        ...normals,
        stationId: match.station.id,
        stationName: match.station.name,
        stationDistanceMiles: Number(match.distance.toFixed(2)),
      };
    } catch (err) {
      error(`NOAA fetch failed for ${city.city}, ${city.stateId}`, err);
    }
    processed++;
    if (processed % 25 === 0) {
      progress(processed, todo.length, "NOAA cities");
      await writeJson(OUTPUT_FILE, cache);
    }
  }
  await writeJson(OUTPUT_FILE, cache);
  info(`NOAA: cache now has ${Object.keys(cache).length} cities`);
  return cache;
}

if (process.argv[1] && process.argv[1].endsWith("fetch-noaa.ts")) {
  const args = parseArgs(process.argv.slice(2));
  const radIdx = process.argv.indexOf("--radius");
  const radiusMiles =
    radIdx >= 0 && process.argv[radIdx + 1]
      ? Number(process.argv[radIdx + 1])
      : undefined;
  fetchNoaa({ ...args, radiusMiles }).catch((err) => {
    error("fetch-noaa fatal", err);
    process.exit(1);
  });
}

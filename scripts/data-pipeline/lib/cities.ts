import { promises as fs } from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv";
import { citySlug, slugify } from "./slug";

export type RawCity = {
  city: string;
  cityAscii: string;
  stateId: string;
  stateName: string;
  countyName: string;
  lat: number;
  lng: number;
  population: number;
  density: number;
  zips: string[];
  ranking: number;
  sourceId: string;
  citySlug: string;
  stateSlug: string;
};

const SOURCE_CSV = path.join(
  process.cwd(),
  "scripts/data-pipeline/raw/uscities.csv",
);

export async function loadRawCities(opts?: {
  limit?: number;
  minPopulation?: number;
}): Promise<RawCity[]> {
  let raw: string;
  try {
    raw = await fs.readFile(SOURCE_CSV, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Missing SimpleMaps CSV at ${SOURCE_CSV}.\n` +
          `Download the free "US Cities Basic" CSV from\n` +
          `  https://simplemaps.com/data/us-cities\n` +
          `unzip it, and place uscities.csv at the path above.`,
      );
    }
    throw err;
  }

  const rows = parseCsv(raw);
  const cities: RawCity[] = rows
    .map((r) => {
      const city = r.city || r.city_ascii || "";
      const stateId = r.state_id || "";
      const population = Number(r.population || "0");
      const density = Number(r.density || "0");
      const lat = Number(r.lat || "0");
      const lng = Number(r.lng || "0");
      const ranking = Number(r.ranking || "0");
      const zips = (r.zips || "")
        .split(/\s+/)
        .map((z) => z.trim())
        .filter(Boolean);

      return {
        city,
        cityAscii: r.city_ascii || city,
        stateId,
        stateName: r.state_name || "",
        countyName: r.county_name || "",
        lat,
        lng,
        population,
        density,
        zips,
        ranking,
        sourceId: r.id || "",
        citySlug: citySlug(city, stateId),
        stateSlug: slugify(r.state_name || ""),
      };
    })
    .filter((c) => c.city && c.stateId)
    .sort((a, b) => b.population - a.population);

  let filtered = cities;
  if (opts?.minPopulation !== undefined) {
    filtered = filtered.filter((c) => c.population >= opts.minPopulation!);
  }
  if (opts?.limit !== undefined) {
    filtered = filtered.slice(0, opts.limit);
  }
  return filtered;
}

export function parseArgs(argv: string[]): {
  force: boolean;
  limit: number | undefined;
  minPopulation: number | undefined;
} {
  const force = argv.includes("--force");
  const limitIdx = argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 && argv[limitIdx + 1]
      ? Number(argv[limitIdx + 1])
      : undefined;
  const minPopIdx = argv.indexOf("--min-population");
  const minPopulation =
    minPopIdx >= 0 && argv[minPopIdx + 1]
      ? Number(argv[minPopIdx + 1])
      : undefined;
  return { force, limit, minPopulation };
}

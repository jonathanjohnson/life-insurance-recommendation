/**
 * run-all.ts
 *
 * Orchestrates the four stages of the data pipeline. Each stage handles
 * its own cache; failures are logged per city but do not abort the run,
 * so a partial network outage doesn't lose work already done.
 *
 * Usage:
 *   pnpm data:build
 *   pnpm data:build -- --force --limit 50 --min-population 50000
 *   pnpm data:build -- --skip-census --skip-noaa   (offline merge only)
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.join(process.cwd(), ".env.local") });
loadEnv({ path: path.join(process.cwd(), ".env"), override: false });

import { fetchCensus } from "./fetch-census";
import { fetchNoaa } from "./fetch-noaa";
import { generatePricing } from "./generate-pricing";
import { parseArgs } from "./lib/cities";
import { error, info } from "./lib/log";
import { mergeData } from "./merge-data";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const argv = process.argv.slice(2);
  const skipCensus = argv.includes("--skip-census");
  const skipNoaa = argv.includes("--skip-noaa");
  const skipPricing = argv.includes("--skip-pricing");

  const radIdx = argv.indexOf("--radius");
  const radiusMiles =
    radIdx >= 0 && argv[radIdx + 1] ? Number(argv[radIdx + 1]) : undefined;

  const started = Date.now();
  info(
    `Starting pipeline: force=${args.force}, limit=${args.limit ?? "all"}, minPop=${args.minPopulation ?? "—"}`,
  );

  if (skipCensus) {
    info("Skipping Census stage (--skip-census)");
  } else {
    info("Stage 1/4: Census ACS 5-year (2022)");
    try {
      await fetchCensus(args);
    } catch (err) {
      error("Census stage aborted; continuing with whatever is cached", err);
    }
  }

  if (skipNoaa) {
    info("Skipping NOAA stage (--skip-noaa)");
  } else {
    info("Stage 2/4: NOAA NCEI climate normals");
    try {
      await fetchNoaa({ ...args, radiusMiles });
    } catch (err) {
      error("NOAA stage aborted; continuing with whatever is cached", err);
    }
  }

  if (skipPricing) {
    info("Skipping pricing stage (--skip-pricing)");
  } else {
    info("Stage 3/4: HVAC pricing");
    try {
      await generatePricing(args);
    } catch (err) {
      error("Pricing stage failed", err);
    }
  }

  info("Stage 4/4: Merge → lib/data");
  await mergeData(args);

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  info(`Pipeline complete in ${elapsed}s`);
}

main().catch((err) => {
  error("Pipeline fatal", err);
  process.exit(1);
});

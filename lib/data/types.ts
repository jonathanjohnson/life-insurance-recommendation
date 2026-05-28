/**
 * Static shape of the JSON produced by scripts/data-pipeline. Kept in sync
 * by hand because the pipeline writes these files; treat as the single
 * source of truth for the runtime app.
 */

export type Tier = "A" | "B" | "C";

export interface HousingData {
  medianHomeValue: number | null;
  medianIncome: number | null;
  totalUnits: number | null;
}

export interface ClimateData {
  avgHigh: number | null;
  avgLow: number | null;
  annualPrecip: number | null;
  daysOver90: number | null;
  daysUnder32: number | null;
  stationId: string | null;
  stationDistanceMiles: number | null;
}

export interface PricingTier {
  low: number;
  median: number;
  high: number;
}
export type Repair = PricingTier;
export type Install = PricingTier;
export type Maintenance = PricingTier;
export type Emergency = PricingTier;

export interface PricingData {
  repair: Repair;
  install: Install;
  maintenance: Maintenance;
  emergency: Emergency;
  costOfLivingFactor: number;
  acSurcharge: boolean;
  heatSurcharge: boolean;
}

export interface City {
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
  housing: HousingData;
  climate: ClimateData;
  pricing: PricingData | null;
  tier: Tier;
  rank: number;
}

export interface StateTopCity {
  slug: string;
  name: string;
  population: number;
}

export interface State {
  slug: string;
  name: string;
  abbr: string;
  cityCount: number;
  totalPopulation: number;
  topCity: StateTopCity | null;
  avgMedianHomeValue: number | null;
  avgDaysOver90: number | null;
  avgDaysUnder32: number | null;
}

export type CitiesByState = Record<string, string[]>;

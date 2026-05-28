import citiesJson from "./cities.json";
import citiesByStateJson from "./cities-by-state.json";
import statesJson from "./states.json";
import type { CitiesByState, City, State, Tier } from "./types";

const cities = citiesJson as City[];
const states = statesJson as State[];
const citiesByState = citiesByStateJson as CitiesByState;

const cityIndex = new Map<string, City>();
const cityByCompound = new Map<string, City>();
for (const c of cities) {
  cityIndex.set(c.slug, c);
  cityByCompound.set(`${c.stateSlug}/${c.citySlug}`, c);
}

const stateIndex = new Map<string, State>();
for (const s of states) stateIndex.set(s.slug, s);

export function getAllCities(): City[] {
  return cities;
}

export function getAllStates(): State[] {
  return states;
}

export function getCityBySlug(
  stateSlug: string,
  citySlug: string,
): City | null {
  return cityByCompound.get(`${stateSlug}/${citySlug}`) ?? null;
}

export function getStateBySlug(stateSlug: string): State | null {
  return stateIndex.get(stateSlug) ?? null;
}

export function getCitiesByState(stateSlug: string): City[] {
  const slugs = citiesByState[stateSlug];
  if (!slugs) return [];
  const result: City[] = [];
  for (const slug of slugs) {
    const c = cityIndex.get(slug);
    if (c) result.push(c);
  }
  // The pipeline writes them sorted by population desc already; resort
  // defensively in case the file was hand-edited.
  return result.sort((a, b) => b.population - a.population);
}

const EARTH_RADIUS_MI = 3958.7613;
function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(a));
}

export function getNearestCities(city: City, limit = 10): City[] {
  const scored = cities
    .filter((c) => c.slug !== city.slug)
    .map((c) => ({
      city: c,
      distance: distanceMiles(city.lat, city.lng, c.lat, c.lng),
      sameState: c.stateSlug === city.stateSlug,
    }))
    .sort((a, b) => {
      if (a.sameState !== b.sameState) return a.sameState ? -1 : 1;
      return a.distance - b.distance;
    });
  return scored.slice(0, limit).map((s) => s.city);
}

export function getTopCitiesNationally(limit = 25): City[] {
  return [...cities].sort((a, b) => a.rank - b.rank).slice(0, limit);
}

export function getTier(city: City): Tier {
  return city.tier;
}

export type { City, State } from "./types";

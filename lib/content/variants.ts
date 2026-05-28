/**
 * Deterministic content variant rotator for city pages.
 *
 * Same city slug always renders the same content (build-stable, cache-safe).
 * Variants gate themselves on data availability: a template that cites
 * daysOver90 is only eligible for a city whose climate cache holds it.
 * Empty-pool fallback returns a generic but still data-driven variant.
 *
 * Style rules baked into every template here: active voice, no em dashes,
 * no marketing filler ("look no further", "in today's world"), real HVAC
 * vocabulary (SEER2, AFUE, load calc, EPA 608, manual J, variable-speed),
 * short sentences, 2–4 sentence paragraphs.
 */
import type { City } from "@/lib/data/types";

// ---------------------------------------------------------------------------
// Hash + selection
// ---------------------------------------------------------------------------

/** djb2 string hash → unsigned 32-bit int. */
export function hashString(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return h >>> 0;
}

export function selectVariant<T>(items: T[], seed: string, salt: string): T {
  if (items.length === 0) {
    throw new Error(`selectVariant: empty pool for salt="${salt}"`);
  }
  const idx = hashString(`${seed}::${salt}`) % items.length;
  return items[idx];
}

/** Deterministic shuffle (Fisher-Yates seeded by hash). */
export function shuffleDeterministic<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let h = hashString(seed) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Interpolation context
// ---------------------------------------------------------------------------

type Ctx = {
  city: string;
  state: string;
  stateAbbr: string;
  county: string;
  population: string;
  primaryZip: string;
  density: string;
  rank: string;

  // optional — present only if the underlying data point is non-null
  avgHigh?: string;
  avgLow?: string;
  annualPrecip?: string;
  daysOver90?: string;
  daysUnder32?: string;
  medianHomeValue?: string;
  medianIncome?: string;
  totalUnits?: string;
  pricingRepairLow?: string;
  pricingRepairMedian?: string;
  pricingRepairHigh?: string;
  pricingInstallLow?: string;
  pricingInstallMedian?: string;
  pricingInstallHigh?: string;
  pricingMaintenanceMedian?: string;
  pricingEmergencyMedian?: string;
};

const fmtInt = new Intl.NumberFormat("en-US");
const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function buildContext(city: City): Ctx {
  const ctx: Ctx = {
    city: city.cityName,
    state: city.stateName,
    stateAbbr: city.stateAbbr,
    county: city.county || `${city.cityName} area`,
    population: fmtInt.format(city.population),
    primaryZip: city.primary_zip || (city.zips[0] ?? ""),
    density: fmtInt.format(Math.round(city.density)),
    rank: fmtInt.format(city.rank),
  };
  if (city.climate.avgHigh !== null) ctx.avgHigh = `${Math.round(city.climate.avgHigh)}°F`;
  if (city.climate.avgLow !== null) ctx.avgLow = `${Math.round(city.climate.avgLow)}°F`;
  if (city.climate.annualPrecip !== null)
    ctx.annualPrecip = `${city.climate.annualPrecip.toFixed(1)} in`;
  if (city.climate.daysOver90 !== null)
    ctx.daysOver90 = fmtInt.format(Math.round(city.climate.daysOver90));
  if (city.climate.daysUnder32 !== null)
    ctx.daysUnder32 = fmtInt.format(Math.round(city.climate.daysUnder32));
  if (city.housing.medianHomeValue !== null)
    ctx.medianHomeValue = fmtMoney.format(city.housing.medianHomeValue);
  if (city.housing.medianIncome !== null)
    ctx.medianIncome = fmtMoney.format(city.housing.medianIncome);
  if (city.housing.totalUnits !== null)
    ctx.totalUnits = fmtInt.format(city.housing.totalUnits);
  if (city.pricing) {
    ctx.pricingRepairLow = fmtMoney.format(city.pricing.repair.low);
    ctx.pricingRepairMedian = fmtMoney.format(city.pricing.repair.median);
    ctx.pricingRepairHigh = fmtMoney.format(city.pricing.repair.high);
    ctx.pricingInstallLow = fmtMoney.format(city.pricing.install.low);
    ctx.pricingInstallMedian = fmtMoney.format(city.pricing.install.median);
    ctx.pricingInstallHigh = fmtMoney.format(city.pricing.install.high);
    ctx.pricingMaintenanceMedian = fmtMoney.format(city.pricing.maintenance.median);
    ctx.pricingEmergencyMedian = fmtMoney.format(city.pricing.emergency.median);
  }
  return ctx;
}

function interpolate(template: string, ctx: Ctx): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = ctx[key as keyof Ctx];
    if (v === undefined) {
      throw new Error(`interpolate: missing key "${key}" in context`);
    }
    return v;
  });
}

// ---------------------------------------------------------------------------
// Variant types
// ---------------------------------------------------------------------------

type DataKey = keyof Ctx;

interface TextVariant {
  /** Required ctx keys; variants whose keys aren't all present are skipped. */
  requires: DataKey[];
  template: string;
}

interface FaqVariant {
  question: string;
  answer: string;
  requires: DataKey[];
}

interface FaqEntry {
  id: string;
  variants: FaqVariant[];
}

function pickEligible<T extends { requires: DataKey[] }>(
  pool: T[],
  ctx: Ctx,
): T[] {
  return pool.filter((v) => v.requires.every((k) => ctx[k] !== undefined));
}

function selectInterpolated(
  pool: TextVariant[],
  ctx: Ctx,
  seed: string,
  salt: string,
): string {
  const eligible = pickEligible(pool, ctx);
  if (eligible.length === 0) {
    throw new Error(`No eligible variants for ${salt}; required data missing`);
  }
  const chosen = selectVariant(eligible, seed, salt);
  return interpolate(chosen.template, ctx);
}

// ---------------------------------------------------------------------------
// Variant pools
//
// `requires` lists the ctx keys an entry depends on. The rotator filters
// variants whose data is unavailable for a given city before hashing, so
// every rendered paragraph cites real numbers.
// ---------------------------------------------------------------------------

const introVariants: TextVariant[] = [
  // Fallback for cities without enriched climate/pricing data yet. Uses only
  // fields that are always populated so every city renders something real.
  {
    requires: ["population", "county", "rank"],
    template:
      "{city} sits in {state}'s {county} region and ranks #{rank} nationally by population, with {population} residents in the metro. The local HVAC trade handles repair, replacement, and maintenance across both cooling and heating seasons. Equipment lifespan, SEER2 rating, and Manual J load calc shape almost every install decision in this market.",
  },
  {
    requires: ["avgHigh", "avgLow", "pricingRepairMedian", "population"],
    template:
      "{city}, {state} runs HVAC equipment through a yearly swing from a {avgLow} winter low to a {avgHigh} summer high. Across the {population} residents in the metro, that range drives steady demand for tune-ups, refrigerant top-offs, and full replacements. Local repair calls land near {pricingRepairMedian} on a typical visit, with diagnostics rolled into the final price. Capacitors, contactors, and weak blower motors are the usual culprits behind a no-cool or no-heat call.",
  },
  {
    requires: ["daysOver90", "pricingInstallMedian", "totalUnits", "stateAbbr"],
    template:
      "Cooling load is the headline story in {city}. The city logs {daysOver90} days at or above 90°F per year, and the {totalUnits} housing units in the metro lean on AC for most of the cooling season. A full replacement here runs around {pricingInstallMedian}, with right-sizing handled by a Manual J load calc and matched indoor and outdoor equipment. Single-stage installs serve smaller, well-sealed homes; variable-speed systems pay back fastest in larger {stateAbbr} homes with mixed ductwork.",
  },
  {
    requires: ["daysUnder32", "avgLow", "medianHomeValue", "pricingInstallMedian"],
    template:
      "Winters in {city} push hard on heating systems. The city sees {daysUnder32} nights below freezing per year and average lows of {avgLow}. Combined with the {medianHomeValue} median home value, that means AFUE rating and burner condition matter as much as the price tag. A condensing furnace install lands near {pricingInstallMedian} with venting and permits included, and the high-AFUE step-up usually pays back within seven heating seasons.",
  },
  {
    requires: ["annualPrecip", "avgHigh", "population", "totalUnits"],
    template:
      "Humidity follows the {annualPrecip} of yearly precipitation that lands on {city}, and that has consequences inside ductwork. Variable-speed compressors and modulating blowers handle the latent load better than single-stage equipment, especially on shoulder-season days when single-stage units short-cycle. The {population} residents of the {state} metro see the difference on summer days near {avgHigh}. Across {totalUnits} units in the metro, a duct-leakage measurement is usually the first test worth paying for.",
  },
  {
    requires: ["medianHomeValue", "totalUnits", "pricingMaintenanceMedian", "pricingRepairMedian"],
    template:
      "Housing in {city} skews toward a {medianHomeValue} median value across {totalUnits} units. Older stock tends to hide leaky returns and undersized supply runs that drop airflow below the 400 CFM-per-ton target. A maintenance visit averages {pricingMaintenanceMedian} here and is the cheapest way to catch those issues before peak season. Skipping the visit usually adds {pricingRepairMedian} in summer repair costs over the next 18 months, and the gap widens once equipment ages past the 12-year mark.",
  },
  {
    requires: ["rank", "population", "pricingEmergencyMedian", "pricingRepairMedian"],
    template:
      "{city} ranks #{rank} nationally by population. With {population} residents, after-hours HVAC calls move fast in this market and the local trade staffs weekend and overnight shifts during peak season. An emergency dispatch averages {pricingEmergencyMedian} once parts, diagnostics, and overtime labor are tallied. A scheduled daytime repair on the same scope averages {pricingRepairMedian}, and that gap is the strongest argument for spring and fall tune-ups. Booking preventive service in shoulder seasons usually shortens the dispatch window from days to hours when something does fail.",
  },
  {
    requires: ["county", "avgHigh", "daysOver90", "pricingRepairMedian"],
    template:
      "Around {county}, AC compressors stay on the clock through summer. {city} sees average highs near {avgHigh} and {daysOver90} days above 90°F. That workload pushes SEER2 ratings, capacitor health, and refrigerant charge to the top of any service plan. A typical repair here averages {pricingRepairMedian}, and the most common summer call is a failed dual-run capacitor on a condenser older than ten years. Catching that on a spring tune-up is usually a 20-minute swap rather than a half-day emergency.",
  },
  {
    requires: ["primaryZip", "daysOver90", "daysUnder32", "pricingInstallMedian"],
    template:
      "ZIP {primaryZip} and the rest of {city} carry a dual climate load: {daysOver90} days above 90°F and {daysUnder32} below freezing each year. Heat pumps with auxiliary heat are a popular fit for this mix, and modern variable-speed cold-climate models handle both ends of the range. Sizing depends on the home's envelope and a Manual J calc, not on the existing equipment's nameplate. A matched system in this market averages {pricingInstallMedian} installed.",
  },
  {
    requires: ["medianIncome", "pricingInstallLow", "pricingInstallHigh", "totalUnits"],
    template:
      "Median household income in {city} sits at {medianIncome}, which shapes which equipment tier homeowners pick across the {totalUnits} units in the metro. Installs in this market range from {pricingInstallLow} for a like-for-like swap to {pricingInstallHigh} for a high-efficiency variable-speed system with new ductwork. Permits, line-set replacement, and a written Manual J load calc are part of either path. Skipping the load calc is the most common reason new systems short-cycle within two seasons.",
  },
];

const whyCityMattersVariants: TextVariant[] = [
  // Fallback: no enriched-data dependencies.
  {
    requires: ["population", "county", "state"],
    template:
      "HVAC equipment in {city} earns its keep across the {population} residents in the {county} area. Cooling and heating loads both shift with the seasons, so spring and fall tune-ups are the cheapest way to keep a system in spec. SEER2 ratings drive cooling efficiency, AFUE drives heating efficiency, and a Manual J load calc decides what size system the home actually needs (not what the existing nameplate says). Across the metro, the most common repair calls are weak capacitors, slow refrigerant leaks, and undersized return ducts that drop airflow below the 400 CFM-per-ton target. Catching these on a maintenance visit is far cheaper than catching them on an after-hours emergency call. A licensed tech with EPA 608 certification handles refrigerant; a state-licensed contractor handles permits and warranty registration.",
  },
  {
    requires: ["daysOver90", "avgHigh", "totalUnits", "pricingRepairMedian"],
    template:
      "Cooling demand in {city} is not occasional. {daysOver90} days a year reach 90°F or higher and the average summer high is {avgHigh}. Across {totalUnits} housing units, that workload exposes weak capacitors, low refrigerant charge, and undersized return ducts long before equipment fails outright. A licensed tech with EPA 608 certification can verify refrigerant levels, megger-check the compressor windings, and confirm static pressure across the coil. Skipping these checks pushes most homeowners into emergency calls during heat waves, where parts availability tightens and labor runs at overtime rates. Planning the work in spring keeps an average repair near {pricingRepairMedian} instead of the surcharged after-hours price.",
  },
  {
    requires: ["daysUnder32", "avgLow", "medianHomeValue", "pricingInstallMedian"],
    template:
      "Heating equipment in {city} earns its keep. The city logs {daysUnder32} nights below 32°F and average lows of {avgLow}. With a {medianHomeValue} median home value, replacement decisions are not casual; AFUE rating, modulating burners, and proper venting all change the lifetime cost of a furnace. Heat exchangers crack quietly, and CO leaks are easy to miss without a combustion analyzer reading. A new system in this market averages {pricingInstallMedian} installed, and that price usually reflects a Manual J load calc, new flue, and a fresh thermostat. Skipping the load calc is the most common reason new furnaces short-cycle within two seasons.",
  },
  {
    requires: ["annualPrecip", "avgHigh", "totalUnits", "density"],
    template:
      "Humidity changes how HVAC equipment behaves in {city}. {annualPrecip} of annual precipitation feeds the latent load that single-stage compressors struggle to remove on mild days. Variable-speed equipment runs longer cycles at lower capacity, which pulls more moisture out of the air without freezing the indoor coil. Across {totalUnits} housing units at {density} people per square mile, attic and crawl-space ductwork picks up leaks where mastic has aged out. A blower-door test paired with a duct-leakage measurement usually pays for itself in the first cooling season. Summer highs near {avgHigh} make that payback obvious on the utility bill.",
  },
  {
    requires: ["medianHomeValue", "totalUnits", "medianIncome", "pricingMaintenanceMedian"],
    template:
      "Housing stock shapes HVAC choices in {city}. The {totalUnits} units in the metro carry a median value of {medianHomeValue}, and median household income of {medianIncome} sets the budget for service plans. Older homes here tend to have rectangular trunk-and-branch ductwork that was sized for furnaces with much higher static pressure tolerance than today's variable-speed air handlers. The fix is rarely the equipment alone; a ductwork audit catches the constrictions that drop airflow below the 400 CFM-per-ton target. Twice-yearly maintenance averages {pricingMaintenanceMedian} in this market and includes refrigerant pressures, blower amp draw, and inducer combustion checks. Catching small drift early is what keeps repair costs predictable.",
  },
  {
    requires: ["daysOver90", "daysUnder32", "avgHigh", "avgLow"],
    template:
      "{city} sits in a dual-climate band. The year brings {daysOver90} days above 90°F and {daysUnder32} below freezing, with average extremes from {avgLow} to {avgHigh}. Equipment that handles one season well can fall short in the other if it was sized to a rule of thumb. A heat pump with electric or gas auxiliary heat is often the right fit here, but only after a Manual J calc confirms heating and cooling loads independently. SEER2 ratings drive cooling efficiency; HSPF2 and AFUE drive heating efficiency. Asking a contractor for both numbers, plus the load-calc printout, separates careful installs from quick swaps.",
  },
  {
    requires: ["population", "rank", "pricingRepairMedian", "pricingEmergencyMedian"],
    template:
      "Service capacity in {city} reflects its size. With {population} residents and a national rank of #{rank}, the local trade has enough volume to staff weekend and overnight shifts. That matters most during heat waves and cold snaps, when call queues stretch and parts move quickly off shelves. A daytime repair averages {pricingRepairMedian} here; emergency dispatch runs closer to {pricingEmergencyMedian} once overtime and after-hours diagnostics are included. The price gap is the strongest argument for spring tune-ups and a maintenance contract. Catching a slow refrigerant leak in April costs a fraction of a Saturday-night condenser fan replacement.",
  },
  {
    requires: ["medianHomeValue", "pricingInstallLow", "pricingInstallHigh", "totalUnits"],
    template:
      "Equipment choice in {city} comes down to fit, not brand loyalty. The {totalUnits} homes in the metro range from tight new builds to leaky 1960s ranches, and the {medianHomeValue} median sale price hints at how mixed the stock is. Installs run from {pricingInstallLow} for a single-stage 14.3 SEER2 swap to {pricingInstallHigh} for a high-efficiency variable-speed system with new line sets and a tested duct system. The right number sits between those poles for most homes. A load calc, a duct audit, and a written scope of work make the bid comparison meaningful. Apples-to-apples bidding is how homeowners avoid paying for ductwork twice.",
  },
  {
    requires: ["annualPrecip", "daysUnder32", "primaryZip", "county"],
    template:
      "Combustion appliances in {county} (ZIP {primaryZip} and the rest of {city}) need attention every fall. With {daysUnder32} freezing nights and {annualPrecip} of yearly precipitation, vents can ice or block from debris pushed in by storms. A combustion analyzer reading should be part of every furnace tune-up; it shows CO, O2, and stack temperature in numbers, not impressions. Heat exchanger inspection follows, then a static-pressure check at the air handler. None of those tests are optional under a manufacturer's warranty. They're also the steps that catch cracked exchangers before the carbon-monoxide alarm does.",
  },
];

const seasonalityVariants: TextVariant[] = [
  // Fallback: no enriched-data dependencies.
  {
    requires: ["city", "state"],
    template:
      "{city} HVAC equipment sees the standard two-season service rhythm: spring tune-ups for cooling, fall tune-ups for heating. Booking outside peak season usually shortens the dispatch window by a week or more and avoids the after-hours surcharge that comes with the first heat wave or hard freeze. A spring visit covers refrigerant pressures, condenser cleaning, capacitor health, and blower amp draw. A fall visit covers combustion-analyzer readings, heat exchanger inspection, gas valve drift, and inducer-motor amp draw. Most equipment manufacturers require documented annual service to keep warranties active, which is a second reason the two-visit cadence pays for itself.",
  },
  {
    requires: ["daysOver90", "pricingMaintenanceMedian", "pricingRepairMedian"],
    template:
      "Spring is the right window to book AC service in {city}. The city's {daysOver90} days above 90°F push call volume into a backlog by mid-June, and supply houses tighten on the most common parts (capacitors, contactors, blower motors) once the season opens. A maintenance visit averaging {pricingMaintenanceMedian} covers refrigerant pressures, condenser cleaning, capacitor health, and blower amp draw before peak load arrives. Catching a slow leak in April runs a fraction of the {pricingRepairMedian} median repair price during a heat wave.",
  },
  {
    requires: ["daysUnder32", "avgLow", "pricingMaintenanceMedian", "pricingEmergencyMedian"],
    template:
      "Fall furnace service holds priority in {city}. Average lows hit {avgLow} and the city sees {daysUnder32} nights below freezing, so heat exchangers, inducer motors, gas valves, and flame sensors earn close attention. A combustion analyzer reading is part of any visit worth the {pricingMaintenanceMedian} ticket; without it, CO drift and burner imbalance go unnoticed. Skipping the visit and ending up on a no-heat call after midnight usually means paying near {pricingEmergencyMedian} for the dispatch.",
  },
  {
    requires: ["daysOver90", "daysUnder32", "pricingInstallMedian"],
    template:
      "{city} works HVAC equipment in both directions: {daysOver90} days above 90°F and {daysUnder32} below freezing each year. Spring and fall tune-ups split the difference, with cooling work front-loaded by April and heating work wrapped by mid-October. Booking outside those peaks usually shortens the schedule by a week or more and gives the homeowner room to compare bids. Major installs near {pricingInstallMedian} are also easier to price-shop in shoulder seasons, when contractors are not stacking same-day jobs.",
  },
  {
    requires: ["annualPrecip", "avgHigh", "pricingRepairMedian"],
    template:
      "Storm season shapes service timing in {city}. The {annualPrecip} of yearly precipitation washes debris into condenser coils and outdoor disconnects, and {avgHigh} highs follow shortly after. A post-storm visual check on the condenser, plus a refrigerant pressure reading, is cheap insurance once spring rains taper. Catching a blocked coil or a tripped disconnect before the first heat wave keeps repair costs near the {pricingRepairMedian} median rather than pushing into emergency rates.",
  },
  {
    requires: ["pricingRepairMedian", "pricingEmergencyMedian", "pricingMaintenanceMedian"],
    template:
      "Timing matters for cost in {city}. A scheduled repair averages {pricingRepairMedian}, while after-hours emergency calls land closer to {pricingEmergencyMedian} once overtime labor and after-hours diagnostics are added. Pushing tune-ups into peak season is the most common reason that gap appears on a homeowner's bill. A {pricingMaintenanceMedian} preventive visit in spring or fall is usually the difference between a known scope of work and an after-hours dispatch, and it documents the condition of the system for any warranty claim that comes later.",
  },
  {
    requires: ["primaryZip", "daysOver90", "pricingInstallMedian"],
    template:
      "ZIP {primaryZip} sees the same load curve as the rest of {city}: {daysOver90} days above 90°F crowd the cooling calendar into June through August. Replacement quotes pulled in February usually beat summer pricing because supply houses are still on winter stocking, and dispatch windows for new installs are measured in days rather than weeks. Booking the install for April keeps the home covered before any heat wave. A matched system in this market averages {pricingInstallMedian} with permits, Manual J load calc, and a tested duct system included.",
  },
  {
    requires: ["daysUnder32", "totalUnits", "pricingMaintenanceMedian"],
    template:
      "Cold snaps in {city} expose aging equipment across the {totalUnits} units in the metro. The {daysUnder32} freezing nights per year are enough to surface cracked heat exchangers, weak igniters, and gas valve drift. Booking the furnace service before the first hard freeze is the single best protection against an overnight no-heat call. The {pricingMaintenanceMedian} fall tune-up usually includes a static-pressure check, a combustion analyzer reading, and a fresh inducer-motor amp draw.",
  },
  {
    requires: ["annualPrecip", "density", "pricingMaintenanceMedian"],
    template:
      "Indoor air quality complaints rise after the wet weeks in {city}. With {annualPrecip} of annual precipitation and {density} people per square mile, evaporator coils and condensate drains see the brunt of the humidity load. A drain-line flush and a UV-coil check fit easily into a routine spring visit averaging {pricingMaintenanceMedian}. Catching coil biofilm and a sluggish drain line in March prevents the wet-ceiling call that arrives every July without it.",
  },
];

const faqEntries: FaqEntry[] = [
  // FAQ 1 — when to replace
  {
    id: "when-to-replace",
    variants: [
      // Fallback (no enriched data required).
      {
        requires: ["city"],
        question: "When does a {city} home need a full HVAC replacement instead of a repair?",
        answer:
          "Run the 50% rule: if the repair quote crosses half the cost of a new matched system, replacement usually wins on lifetime cost. A failing compressor on a system older than 12 years is the most common tipping point, especially once R-22 refrigerant is involved. Comparing the recurring small-repair pattern over two seasons against a single install bid usually decides it.",
      },
      {
        requires: ["pricingInstallMedian", "pricingRepairMedian", "pricingRepairHigh"],
        question: "When does a {city} home need a full HVAC replacement instead of a repair?",
        answer:
          "Run the 50% rule: if the repair quote crosses half the cost of a new system, replacement is the better long-term call. In {city} that crossover sits near {pricingInstallMedian} for installs versus {pricingRepairMedian} for typical repairs and {pricingRepairHigh} on the high end. A failing compressor on a system older than 12 years is usually the tipping point, especially once R-22 refrigerant is involved. Adding the cost of recurring small repairs over the next two seasons usually decides the question.",
      },
      {
        requires: ["pricingInstallMedian", "pricingRepairMedian"],
        question: "How old is too old for an HVAC system in {city}?",
        answer:
          "Most condensers in {city} last 12 to 18 years, with furnaces running 15 to 25. Past those ranges, parts get scarce and efficiency drops well below current SEER2 minimums for cooling and AFUE minimums for heating. A replacement here averages {pricingInstallMedian} and usually pays back within 6 to 10 years through utility savings and avoided repair calls. Compare that to a typical {pricingRepairMedian} repair on equipment that may need another visit the following season.",
      },
      {
        requires: ["pricingRepairHigh", "pricingInstallMedian", "totalUnits"],
        question: "Is it worth replacing the outdoor unit only?",
        answer:
          "Matching a new condenser to an aging air handler in {city} rarely earns the SEER2 rating printed on the new equipment because the coil and blower stay undersized for the upgraded refrigerant charge. Manufacturers also restrict warranties on mismatched systems, so a five-year compressor warranty can drop to one. Across the {totalUnits} homes in the metro, the math usually points the same way: spending {pricingRepairHigh} on a partial replacement is hard to justify when {pricingInstallMedian} buys a matched system with full warranty coverage.",
      },
      {
        requires: ["population", "daysOver90", "daysUnder32"],
        question: "How do {city} homeowners decide between heat pump and gas furnace?",
        answer:
          "The choice in {city} comes down to electric rates, gas availability, and how much auxiliary heat the load calc shows. The local climate (about {daysOver90} hot days and {daysUnder32} freezing nights per year) supports both options, and modern cold-climate variable-speed heat pumps cover almost all of the heating range without auxiliary heat. With {population} residents, the local trade has plenty of experience with both. A dual-fuel setup that pairs a heat pump with a gas furnace is the common compromise where winter loads are large.",
      },
      {
        requires: ["daysUnder32", "pricingInstallMedian", "pricingMaintenanceMedian"],
        question: "What replacement timeline works for {city}?",
        answer:
          "Plan replacements in spring or early fall to avoid peak pricing and longer lead times. {city} sees {daysUnder32} nights below freezing per year, so booking furnace work by late September prevents emergency installs. Budget {pricingInstallMedian} for a matched system, with permits and a Manual J load calc included. A {pricingMaintenanceMedian} pre-install tune-up on the existing equipment is the cheapest way to buy time if the budget is not ready yet.",
      },
      {
        requires: ["pricingInstallLow", "pricingInstallHigh", "medianHomeValue"],
        question: "What's the price range for a full system in {city}?",
        answer:
          "Installs in {city} run from {pricingInstallLow} for a single-stage 14.3 SEER2 swap up to {pricingInstallHigh} for a variable-speed high-efficiency system with new line sets and modified ductwork. The {medianHomeValue} median home value shapes which tier most homeowners pick, but the right answer depends on the load calc, not the home price. Most homeowners land in the middle once the load calc and ductwork audit are factored in. Permits and a written warranty are part of either price.",
      },
    ],
  },

  // FAQ 2 — seasonal timing
  {
    id: "seasonal-timing",
    variants: [
      {
        requires: ["city"],
        question: "When should HVAC maintenance be scheduled in {city}?",
        answer:
          "Twice a year is the industry standard: spring for cooling, fall for heating. Each visit covers refrigerant pressures, capacitor health, blower amp draw, static-pressure measurement, and combustion analysis on the gas side. Booking outside peak season usually shortens the dispatch window by a week or more and avoids after-hours surcharges. Most manufacturers require documented annual service to keep warranties active.",
      },
      {
        requires: ["daysOver90", "pricingMaintenanceMedian"],
        question: "When should AC service be scheduled in {city}?",
        answer:
          "Book AC tune-ups between mid-March and late April in {city}. The city's {daysOver90} days above 90°F per year compress the cooling season into a tight window, and call queues stretch by Memorial Day. Spring service catches low refrigerant, weak capacitors, and dirty condenser coils before the first heat wave puts load on the system. A {pricingMaintenanceMedian} visit pays for itself the first time it prevents a refrigerant top-off in July.",
      },
      {
        requires: ["daysUnder32", "pricingMaintenanceMedian", "pricingEmergencyMedian"],
        question: "When does furnace service make sense in {city}?",
        answer:
          "September and early October are the right months for furnace work in {city}. The city logs {daysUnder32} nights below freezing per year, and combustion analyzer readings, heat exchanger inspections, and burner cleanings are easier to schedule before the first hard freeze tightens the calendar. A {pricingMaintenanceMedian} fall tune-up usually catches the gas-valve drift and inducer-motor wear that would otherwise turn into a {pricingEmergencyMedian} midnight no-heat call.",
      },
      {
        requires: ["pricingMaintenanceMedian", "pricingRepairMedian"],
        question: "How often should HVAC maintenance happen in {city}?",
        answer:
          "Twice a year is the industry standard: spring for cooling, fall for heating. Each visit averages {pricingMaintenanceMedian} in {city} and covers refrigerant pressures, capacitor health, blower amp draw, static-pressure measurement, and combustion analysis on the gas side. Most manufacturers require documented annual service to keep warranties active. Two visits per year usually pay for themselves by avoiding a single {pricingRepairMedian} repair during peak season.",
      },
      {
        requires: ["pricingEmergencyMedian", "pricingRepairMedian", "pricingMaintenanceMedian"],
        question: "Why are after-hours HVAC calls more expensive in {city}?",
        answer:
          "Emergency dispatches in {city} average {pricingEmergencyMedian} because they bundle overtime labor, after-hours diagnostics, and a higher truck stock rate for parts pulled outside business hours. A scheduled daytime call on the same scope runs closer to {pricingRepairMedian}, and a planned {pricingMaintenanceMedian} maintenance visit usually prevents the emergency entirely. Booking preventive service in shoulder seasons is the single best way to avoid the after-hours surcharge.",
      },
      {
        requires: ["annualPrecip", "pricingMaintenanceMedian"],
        question: "Does {city}'s rainfall affect service timing?",
        answer:
          "Yes. After the wet stretches that make up {city}'s {annualPrecip} of annual precipitation, condenser coils, outdoor disconnects, and condensate drains all collect debris. A post-storm visual check is a fast add-on to spring service and catches biofilm in the drain line before it backs up into the secondary pan. A standard {pricingMaintenanceMedian} visit covers the inspection and any clearing the system needs.",
      },
      {
        requires: ["daysOver90", "daysUnder32", "pricingMaintenanceMedian"],
        question: "Why two visits per year and not one?",
        answer:
          "{city} cycles between {daysOver90} hot days and {daysUnder32} freezing nights, so cooling and heating components both work hard. A single annual visit misses one side, and the missed side is usually the more expensive to repair under load. Two {pricingMaintenanceMedian} visits keep both sides in spec, protect equipment warranties, and surface the slow drift in refrigerant charge or burner imbalance that gets missed in a one-visit schedule.",
      },
    ],
  },

  // FAQ 3 — costs
  {
    id: "costs",
    variants: [
      {
        requires: ["city"],
        question: "What do HVAC services cost in {city}?",
        answer:
          "Repairs in {city} commonly run a few hundred dollars for capacitor or contactor swaps, with compressor or evaporator-coil work landing well into the thousands. Maintenance visits sit at the low end, and emergency dispatch carries an after-hours surcharge that is disclosed before the truck rolls. Full installs scale with equipment tier (single-stage vs variable-speed) and whether ductwork needs modification.",
      },
      {
        requires: ["pricingRepairLow", "pricingRepairMedian", "pricingRepairHigh"],
        question: "What does an HVAC repair cost in {city}?",
        answer:
          "Repairs in {city} range from {pricingRepairLow} for capacitor or contactor swaps up to {pricingRepairHigh} for compressor or evaporator-coil work. The median repair lands at {pricingRepairMedian}, with diagnostics rolled into the repair price when the work goes ahead. Refrigerant pricing is the most volatile line item; R-410A is currently dropping out of new equipment in favor of A2L blends, so older systems sometimes carry a higher charge price.",
      },
      {
        requires: ["pricingInstallLow", "pricingInstallHigh", "pricingInstallMedian"],
        question: "How much does a new HVAC system cost in {city}?",
        answer:
          "Full installs in {city} run from {pricingInstallLow} for a same-tonnage swap to {pricingInstallHigh} for a high-efficiency variable-speed system with ductwork modifications. The median lands around {pricingInstallMedian} for a matched indoor and outdoor system at the current 14.3 SEER2 minimum. Permits, Manual J load calculations, line-set replacement, and a tested duct system are part of any complete bid.",
      },
      {
        requires: ["pricingMaintenanceMedian", "pricingRepairMedian"],
        question: "What does maintenance cost in {city}?",
        answer:
          "A standard tune-up in {city} averages {pricingMaintenanceMedian} and covers refrigerant pressures, capacitor health, blower amp draw, static-pressure measurement, and combustion analysis on the heating side. Service-plan pricing usually drops that by 10 to 20 percent and includes priority scheduling during peak season. Skipping the visit usually adds {pricingRepairMedian} in repair costs over the following 18 months, and the gap grows once the equipment is past its 10-year warranty window. Two visits per year is the schedule manufacturers expect for warranty coverage.",
      },
      {
        requires: ["pricingEmergencyMedian", "pricingRepairMedian", "pricingMaintenanceMedian"],
        question: "How much do emergency HVAC calls cost in {city}?",
        answer:
          "After-hours dispatch in {city} averages {pricingEmergencyMedian} once overtime labor and after-hours parts fees are added. Daytime repair on the same scope averages {pricingRepairMedian}. The gap is the strongest argument for booking a {pricingMaintenanceMedian} preventive visit in spring and fall, which usually catches the slow drift in refrigerant charge or burner balance that turns into an emergency by July or January.",
      },
      {
        requires: ["medianHomeValue", "pricingInstallMedian", "pricingRepairMedian"],
        question: "Does home value affect HVAC pricing in {city}?",
        answer:
          "Indirectly, yes. The {medianHomeValue} median home value in {city} reflects labor and operating costs across the local trade, and installs scale with that pattern. A full system here averages {pricingInstallMedian}, and a typical repair runs {pricingRepairMedian}. Lower cost-of-living markets run cheaper on labor; denser metros run higher because techs and trucks cost more to keep on the road.",
      },
      {
        requires: ["pricingRepairMedian", "pricingMaintenanceMedian", "pricingEmergencyMedian"],
        question: "Are HVAC service plans worth it in {city}?",
        answer:
          "For most homes in {city}, yes. A maintenance plan averages {pricingMaintenanceMedian} per visit and usually catches issues that would otherwise become {pricingRepairMedian} repairs (or {pricingEmergencyMedian} emergencies in peak season). Plans also lock in priority scheduling, which matters during the first heat wave or first hard freeze when call queues open at 6 a.m. and book out within hours.",
      },
    ],
  },

  // FAQ 4 — equipment / climate fit
  {
    id: "equipment-fit",
    variants: [
      {
        requires: ["city"],
        question: "What kind of HVAC system fits {city} homes best?",
        answer:
          "Variable-speed equipment usually outperforms single-stage on shoulder-season comfort because longer cycles at part load pull more moisture out of the air. Heat pumps with auxiliary heat fit most climates today, including cold-climate models that hold capacity well into the teens. The right answer for any given home depends on the load calc, the envelope, and how much auxiliary heat the design conditions show.",
      },
      {
        requires: ["daysOver90", "daysUnder32", "pricingInstallMedian"],
        question: "Is a heat pump a good fit for {city}?",
        answer:
          "Heat pumps work well in {city}, especially with electric or gas auxiliary heat. The {daysOver90} hot days and {daysUnder32} freezing nights per year both fit within the operating range of modern variable-speed cold-climate models, which hold capacity well into the teens. A load calc decides whether single-stage backup heat is enough or whether a dual-fuel setup makes more sense. A matched system here averages {pricingInstallMedian} with auxiliary heat included.",
      },
      {
        requires: ["daysOver90", "avgHigh", "pricingInstallMedian"],
        question: "What SEER2 rating makes sense for {city}?",
        answer:
          "With {daysOver90} cooling-degree days and average highs near {avgHigh}, {city} homeowners usually recover the premium on a 16+ SEER2 system within 5 to 8 years through utility savings. Below 14.3 SEER2 is no longer code in this region. Above 18 SEER2 is worth it mostly for high-use households or homes with poor envelope efficiency, and the install cost moves up from the {pricingInstallMedian} median accordingly.",
      },
      {
        requires: ["daysUnder32", "avgLow", "pricingInstallMedian"],
        question: "What AFUE rating fits {city} winters?",
        answer:
          "Average lows of {avgLow} and {daysUnder32} freezing nights per year justify 90+ AFUE condensing furnaces in most {city} homes. The 95 to 98 AFUE range pays back fastest where natural gas rates are mid-pack or higher, and the venting change (PVC instead of metal) is usually straightforward in a retrofit. A condensing install lands near {pricingInstallMedian} including the new flue and condensate drain.",
      },
      {
        requires: ["annualPrecip", "pricingMaintenanceMedian"],
        question: "Does humidity in {city} change the equipment choice?",
        answer:
          "Yes. {city}'s {annualPrecip} of yearly precipitation drives a latent load that single-stage compressors handle poorly on mild days, when sensible load drops but moisture stays. Variable-speed equipment runs longer cycles at part load and pulls more moisture out of the air, which improves comfort without the freeze-up risk. A {pricingMaintenanceMedian} maintenance visit confirms the refrigerant charge and static pressure that keep latent capacity in spec.",
      },
      {
        requires: ["totalUnits", "medianHomeValue", "pricingRepairMedian"],
        question: "Does the age of {city} housing affect equipment choice?",
        answer:
          "Often. Across the {totalUnits} units in the metro at {medianHomeValue} median value, ductwork tends to predate modern variable-speed air handlers and was sized for furnaces with higher static-pressure tolerance. A duct audit usually surfaces static-pressure issues that drop airflow below the 400 CFM-per-ton target. Catching that during a {pricingRepairMedian} service call is much cheaper than discovering it after the new equipment is in.",
      },
      {
        requires: ["daysOver90", "daysUnder32", "pricingInstallMedian"],
        question: "Single-stage, two-stage, or variable-speed in {city}?",
        answer:
          "{city}'s mix of {daysOver90} hot days and {daysUnder32} cold nights pushes most homes toward two-stage or variable-speed equipment. The price step up is modest against the {pricingInstallMedian} median install, and comfort improves measurably on shoulder-season days when single-stage equipment short-cycles. Two-stage is usually the right balance for mid-sized homes; variable-speed earns its premium on larger floor plans and homes with significant zoning.",
      },
    ],
  },

  // FAQ 5 — finding / vetting a contractor
  {
    id: "contractor-vetting",
    variants: [
      {
        requires: ["city"],
        question: "How should a {city} homeowner vet an HVAC contractor?",
        answer:
          "Ask for an EPA 608 certification, current state HVAC license, and proof of liability insurance. A written Manual J load calc and a static-pressure reading should be part of any install bid. Three bids on apples-to-apples scopes (ductwork, line sets, permits, warranty terms) are the standard for a major install, and the lowest number is rarely the right answer once scope differences are accounted for.",
      },
      {
        requires: ["population", "pricingInstallMedian"],
        question: "How should a {city} homeowner vet an HVAC contractor?",
        answer:
          "Ask for an EPA 608 certification, current state HVAC license, and proof of liability insurance. With {population} residents in the {city} metro, the local market has plenty of certified options. A written Manual J load calc and a static-pressure reading should be part of any bid. On a {pricingInstallMedian} install, both items take a tech under an hour and protect the buyer from oversizing or airflow problems.",
      },
      {
        requires: ["pricingInstallMedian", "pricingInstallLow", "pricingInstallHigh"],
        question: "How many install bids should a {city} homeowner pull?",
        answer:
          "Three is the standard. A {pricingInstallMedian} system is a 10 to 15 year decision, and bid comparisons surface scope differences (ductwork, line sets, permits, warranty terms) that the price alone hides. Apples-to-apples scopes matter more than the absolute dollar number. Bids that range from {pricingInstallLow} to {pricingInstallHigh} usually reflect different scope, not just different markup.",
      },
      {
        requires: ["primaryZip", "pricingRepairMedian"],
        question: "Should the contractor be local to ZIP {primaryZip}?",
        answer:
          "A nearby service area helps with response times on warranty callbacks and seasonal tune-ups. Contractors based in {city} or its adjacent ZIPs usually have shorter dispatch windows than out-of-area shops, which matters most when a no-cool or no-heat call lands. Check that their published service area includes {primaryZip}, and confirm that a same-day {pricingRepairMedian} repair call is something they can usually staff.",
      },
      {
        requires: ["pricingRepairMedian", "pricingRepairHigh"],
        question: "What questions should a homeowner ask before a {city} repair?",
        answer:
          "Ask for the diagnostic fee in writing, the price band for the most likely repair (a typical fix in {city} runs near {pricingRepairMedian}, with the high end around {pricingRepairHigh}), and whether the diagnostic rolls into the repair price. Pushy upsells on the first visit are a warning sign; a careful tech will quote the immediate fix, then write up any deferred work for the homeowner to review.",
      },
      {
        requires: ["population", "rank", "pricingInstallMedian"],
        question: "Are nationally-branded chains better than local shops in {city}?",
        answer:
          "Neither has a structural edge. {city}'s rank of #{rank} and {population} residents support both. Look at technician certifications, warranty terms, recent online reviews from the last 18 months, and how the bid handles permits and load calc. On a {pricingInstallMedian} install, the logo on the truck matters far less than the scope and warranty paperwork.",
      },
      {
        requires: ["pricingInstallMedian", "pricingInstallHigh"],
        question: "What red flags appear on bad HVAC install quotes in {city}?",
        answer:
          "No Manual J load calc, no static-pressure reading, equipment sized to match what's already there, vague warranty terms, and no line-item for permits. Any of those on a quote near {pricingInstallMedian} (or higher, toward {pricingInstallHigh}) usually means the install will underperform within a few seasons. Verbal-only warranty terms are the most common gap; written manufacturer registration is non-negotiable.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface CityContent {
  intro: string;
  whyCityMatters: string;
  seasonality: string;
  faqs: { question: string; answer: string }[];
}

export function generateCityContent(city: City): CityContent {
  const ctx = buildContext(city);
  const seed = city.slug;

  const intro = selectInterpolated(introVariants, ctx, seed, "intro");
  const whyCityMatters = selectInterpolated(
    whyCityMattersVariants,
    ctx,
    seed,
    "why-city-matters",
  );
  const seasonality = selectInterpolated(
    seasonalityVariants,
    ctx,
    seed,
    "seasonality",
  );

  // FAQ count: pick 5-6 deterministically, then pick one phrasing per entry
  // and shuffle their order. Skip entries whose pool has no eligible variants
  // for this city (e.g. pricing missing).
  const faqCount = 5 + (hashString(`${seed}::faq-count`) % 2);
  const orderedEntries = shuffleDeterministic(faqEntries, `${seed}::faq-order`);
  const faqs: { question: string; answer: string }[] = [];
  for (const entry of orderedEntries) {
    if (faqs.length >= faqCount) break;
    const eligible = pickEligible(entry.variants, ctx);
    if (eligible.length === 0) continue;
    const chosen = selectVariant(eligible, seed, `faq::${entry.id}`);
    faqs.push({
      question: interpolate(chosen.question, ctx),
      answer: interpolate(chosen.answer, ctx),
    });
  }

  return { intro, whyCityMatters, seasonality, faqs };
}

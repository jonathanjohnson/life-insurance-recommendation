import Link from "next/link";
import { ShieldCheck, ThermometerSun, ThermometerSnowflake } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PhoneCTA } from "@/components/ui/PhoneCTA";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SchemaInjector } from "@/components/seo/SchemaInjector";
import { buildFAQSchema, buildServiceSchema } from "@/lib/seo/schema";
import type { City, State } from "@/lib/data/types";

const fmtInt = new Intl.NumberFormat("en-US");
const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PHONE_NUMBER = "+18004822776";
const PHONE_DISPLAY = "1-800-HVAC-PRO";

const NATIONAL_MEDIAN_REPAIR = 325;

function stateFaqs(state: State, topCity: City | null) {
  const stateName = state.name;
  const heading = topCity?.cityName ?? "the largest metros";
  return [
    {
      question: `How do I find a licensed HVAC contractor in ${stateName}?`,
      answer: `Start with a state HVAC license lookup and verify EPA 608 certification for any tech that handles refrigerant. Contractors listed on this site hold both, plus active liability insurance. Bids should include a written Manual J load calc and a static-pressure reading before any equipment is recommended.`,
    },
    {
      question: `What does an HVAC repair typically cost in ${stateName}?`,
      answer: `Repair costs in ${stateName} track the local cost of living and climate load. The national median sits near ${fmtMoney.format(NATIONAL_MEDIAN_REPAIR)}; metros with heavy cooling demand or higher labor costs run above that range. Each city page on this site lists local low, median, and high pricing for repair, install, maintenance, and emergency work.`,
    },
    {
      question: `When should ${stateName} homeowners schedule HVAC maintenance?`,
      answer: `Twice a year is the industry standard: spring for cooling, fall for heating. Booking outside peak season usually shortens dispatch windows by a week or more and avoids after-hours surcharges during heat waves and cold snaps. Most manufacturers require documented annual service to keep warranties active.`,
    },
    {
      question: `Are HVAC permits required in ${stateName}?`,
      answer: `Most jurisdictions in ${stateName} require permits for new installs, refrigerant line replacement, and gas-side work. Permits protect homeowner warranties, unlock manufacturer rebates, and are required for resale disclosure. Reputable contractors line-item permits on every install bid.`,
    },
    {
      question: `Heat pump or gas furnace for ${stateName}?`,
      answer: `The right answer depends on the load calc, the electric and gas rates in your area, and how much auxiliary heat the home needs. Modern variable-speed cold-climate heat pumps cover most of ${heading}'s heating range without auxiliary heat. Dual-fuel setups remain a common compromise where winter loads are large.`,
    },
  ];
}

interface StatePageProps {
  state: State;
  /** City list pre-sorted by population descending. */
  cities: City[];
}

export function StatePage({ state, cities }: StatePageProps) {
  const top5 = cities.slice(0, 5);
  const cityGrid = cities.slice(0, 50);
  const heroCity = top5[0] ?? null;

  const faqs = stateFaqs(state, heroCity);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: state.name },
  ];

  const schemas = [
    buildServiceSchema({
      name: `HVAC contractors in ${state.name}`,
      areaServed: { "@type": "State", name: state.name },
      serviceType: "HVAC contractor referral",
      description: `Match with licensed HVAC contractors across ${state.name}.`,
      url: `/${state.slug}`,
    }),
    buildFAQSchema(faqs),
    // BreadcrumbList is emitted by the <Breadcrumbs> component below.
  ];

  return (
    <>
      <SchemaInjector schemas={schemas} />

      <SectionContainer tight>
        <Breadcrumbs items={breadcrumbItems} />
      </SectionContainer>

      {/* Hero */}
      <SectionContainer className="pt-2">
        <p className="text-sm font-medium uppercase tracking-wider text-brand">
          {state.name}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          HVAC contractors in {state.name}. Compare local pros.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Vetted, licensed contractors across {state.name}. Free written quotes
          for repair, replacement, and maintenance. Permits and Manual J load
          calcs included on every install bid.
        </p>
        <form
          action="/find-pros"
          method="get"
          aria-label="City or ZIP lookup"
          className="mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="state-zip" className="sr-only">
            City or ZIP code
          </label>
          <input
            id="state-zip"
            type="text"
            name="zip"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            required
            placeholder={`ZIP in ${state.name}`}
            className="h-12 flex-1 rounded-md border border-input bg-background px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <button
            type="submit"
            className="h-12 rounded-md bg-brand px-6 font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Find pros
          </button>
        </form>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Or call</span>
          <PhoneCTA
            phoneNumber={PHONE_NUMBER}
            displayNumber={PHONE_DISPLAY}
            location={`state-hero-${state.slug}`}
            variant="ghost"
            size="sm"
          />
        </div>
      </SectionContainer>

      {/* State data block */}
      <SectionContainer
        as="section"
        aria-labelledby="state-stats"
        className="bg-muted/30"
      >
        <h2
          id="state-stats"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {state.name} at a glance
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Average repair cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {state.avgMedianHomeValue
                  ? fmtMoney.format(NATIONAL_MEDIAN_REPAIR)
                  : fmtMoney.format(NATIONAL_MEDIAN_REPAIR)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                National median {fmtMoney.format(NATIONAL_MEDIAN_REPAIR)}.
                Local pricing varies by metro.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                State licensing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="size-5 shrink-0 text-brand"
                  aria-hidden
                />
                <p className="text-sm text-muted-foreground">
                  HVAC contractors operating in {state.name} require a current
                  state license and EPA 608 certification for refrigerant
                  handling. Verify both before signing a bid.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Top metros by demand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {top5.length === 0 ? (
                  <li className="text-muted-foreground">
                    City data loads after the data pipeline runs.
                  </li>
                ) : (
                  top5.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/${c.stateSlug}/${c.citySlug}`}
                        className="font-medium hover:text-brand"
                      >
                        {c.cityName}
                      </Link>
                      <span className="text-muted-foreground">
                        {" — "}
                        {fmtInt.format(c.population)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </SectionContainer>

      {/* Climate & HVAC considerations */}
      <SectionContainer as="section" aria-labelledby="climate">
        <h2
          id="climate"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Climate and HVAC considerations
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ThermometerSun className="size-5 text-brand" aria-hidden />
                <CardTitle className="text-base">
                  Cooling load
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {state.avgDaysOver90 !== null
                  ? `Cities across ${state.name} average ${fmtInt.format(Math.round(state.avgDaysOver90))} days above 90°F per year. SEER2 ratings, capacitor health, and refrigerant charge are the top items on any spring tune-up here.`
                  : `Cooling demand in ${state.name} varies by metro. The city pages on this site list days-above-90°F per location so equipment can be sized correctly with a Manual J load calc.`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ThermometerSnowflake
                  className="size-5 text-brand"
                  aria-hidden
                />
                <CardTitle className="text-base">
                  Heating load
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {state.avgDaysUnder32 !== null
                  ? `${state.name} sees an average of ${fmtInt.format(Math.round(state.avgDaysUnder32))} freezing nights per year. AFUE ratings, heat exchanger condition, and combustion-analyzer readings drive most fall service visits.`
                  : `Heating load across ${state.name} varies by metro. The city pages on this site list freezing-night counts so AFUE ratings and equipment tier can be matched to actual demand.`}
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionContainer>

      {/* Cities grid */}
      <SectionContainer
        as="section"
        aria-labelledby="cities-grid"
        className="bg-muted/30"
      >
        <h2
          id="cities-grid"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Cities in {state.name}
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Local pricing, climate, and contractor availability by city.
        </p>
        {cityGrid.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            City pages publish after the data pipeline runs.
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cityGrid.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${c.stateSlug}/${c.citySlug}`}
                  className="group flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-brand"
                >
                  <span className="font-medium group-hover:text-brand">
                    {c.cityName}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {fmtInt.format(c.population)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionContainer>

      {/* FAQ */}
      <SectionContainer as="section" aria-labelledby="state-faq">
        <h2
          id="state-faq"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {state.name} HVAC questions
        </h2>
        <Accordion
          type="single"
          collapsible
          className="mx-auto mt-8 max-w-3xl"
        >
          {faqs.map((f, idx) => (
            <AccordionItem key={f.question} value={`state-faq-${idx}`}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {f.question}
              </AccordionTrigger>
              <AccordionContent
                forceMount
                className="text-sm text-muted-foreground data-[state=closed]:hidden"
              >
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SectionContainer>
    </>
  );
}

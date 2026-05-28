import Link from "next/link";
import {
  Phone,
  CheckCircle2,
  Search,
  ListChecks,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";

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
import { SchemaInjector } from "@/components/seo/SchemaInjector";
import {
  buildFAQSchema,
  buildOrganizationSchema,
  buildServiceSchema,
} from "@/lib/seo/schema";
import type { City, State } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const fmtInt = new Intl.NumberFormat("en-US");
const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PHONE_NUMBER = "+18004822776";
const PHONE_DISPLAY = "1-800-HVAC-PRO";

/**
 * 12-column × 8-row grid that loosely traces the US map. Each entry is
 * [column, row]. AK/HI are conventionally placed in the bottom-left.
 */
const STATE_GRID: Record<string, [number, number]> = {
  ME: [12, 1],
  WI: [7, 2], VT: [11, 2], NH: [12, 2],
  WA: [2, 3], MT: [4, 3], ND: [5, 3], MN: [6, 3],
  IA: [7, 3], MI: [9, 3], NY: [10, 3], MA: [12, 3],
  OR: [2, 4], ID: [3, 4], WY: [4, 4], SD: [5, 4],
  IL: [7, 4], IN: [8, 4], OH: [9, 4], PA: [10, 4],
  CT: [11, 4], RI: [12, 4],
  CA: [2, 5], NV: [3, 5], UT: [4, 5], CO: [5, 5], NE: [6, 5],
  MO: [7, 5], KY: [8, 5], WV: [9, 5], VA: [10, 5], DC: [11, 5], MD: [12, 5],
  AZ: [3, 6], NM: [4, 6], KS: [6, 6], OK: [7, 6],
  AR: [8, 6], TN: [9, 6], NC: [10, 6], NJ: [11, 6], DE: [12, 6],
  TX: [5, 7], LA: [7, 7], MS: [8, 7], AL: [9, 7], GA: [10, 7], SC: [11, 7],
  AK: [1, 8], HI: [2, 8], FL: [10, 8],
};

const NATIONAL_PRICING = [
  { key: "repair", label: "Repair", low: 200, median: 325, high: 450 },
  { key: "install", label: "Install", low: 4500, median: 6500, high: 11000 },
  { key: "maintenance", label: "Maintenance", low: 90, median: 140, high: 225 },
  { key: "emergency", label: "Emergency", low: 275, median: 425, high: 650 },
] as const;

const STEPS = [
  {
    icon: Search,
    title: "Enter your ZIP",
    body: "We use it to match you with licensed pros that already service your area.",
  },
  {
    icon: ListChecks,
    title: "Match with pros",
    body: "We surface up to three vetted contractors with EPA 608 certified technicians.",
  },
  {
    icon: Phone,
    title: "Get free quotes",
    body: "Compare written scopes that include Manual J load calc, permits, and warranty terms.",
  },
];

const NATIONAL_FAQS = [
  {
    question: "How does HVAC Pros Network choose contractors?",
    answer:
      "Every contractor in the network holds a current state HVAC license, EPA 608 certification, and active liability insurance. We verify those credentials annually and review homeowner feedback after each completed job.",
  },
  {
    question: "Is the quote really free?",
    answer:
      "Yes. Contractors pay to receive vetted leads, so homeowners pay nothing for the match or the written quote. Diagnostic fees on a repair visit are disclosed up front and roll into the repair price when the work goes ahead.",
  },
  {
    question: "How fast can someone come out?",
    answer:
      "Most homeowners hear back within an hour during business days, and same-day appointments are common in major metros. Emergency dispatch carries an after-hours surcharge that is disclosed before the truck rolls.",
  },
  {
    question: "Should I repair or replace my HVAC system?",
    answer:
      "Use the 50% rule. If the repair quote crosses half the cost of a new matched system, replacement usually wins on lifetime cost. Equipment older than 12 years with a failing compressor is the most common tipping point.",
  },
  {
    question: "What SEER2 or AFUE rating should I look for?",
    answer:
      "Federal minimums are 14.3 SEER2 for cooling in most regions and 80 AFUE for gas furnaces. Higher ratings pay back faster in hot or cold climates and in homes with high run-time hours. A Manual J load calc decides the size; the rating decides the running cost.",
  },
  {
    question: "Do contractors handle permits?",
    answer:
      "Reputable contractors pull permits for installs and major repairs that touch refrigerant or gas lines. Permits protect homeowner warranties and unlock manufacturer rebates. Quotes that skip permits are a warning sign worth flagging.",
  },
];

interface CountryPageProps {
  topCities: City[];
  topStates: State[];
}

export function CountryPage({ topCities, topStates }: CountryPageProps) {
  const stateBySlug = new Map(topStates.map((s) => [s.abbr, s]));
  const allStateAbbrs = Object.keys(STATE_GRID);

  const schemas = [
    buildOrganizationSchema(),
    buildServiceSchema({
      name: "HVAC contractor matching service",
      areaServed: "United States",
      serviceType: "HVAC contractor referral",
      description:
        "Match with licensed local HVAC contractors for repair, replacement, and seasonal maintenance.",
      url: "/",
    }),
    buildFAQSchema(NATIONAL_FAQS),
  ];

  const visibleCities = topCities.slice(0, 20);

  return (
    <>
      <SchemaInjector schemas={schemas} />

      {/* Hero */}
      <SectionContainer className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-brand">
          Local HVAC pros, nationwide
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Find Licensed HVAC Contractors Near You. Free Quotes Nationwide.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Compare vetted local contractors for repair, replacement, and
          maintenance. Permits, Manual J load calcs, and written warranties
          included on every install bid.
        </p>
        <form
          action="/find-pros"
          method="get"
          aria-label="ZIP code lookup"
          className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="hero-zip" className="sr-only">
            ZIP code
          </label>
          <input
            id="hero-zip"
            type="text"
            name="zip"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            required
            placeholder="Enter ZIP code"
            className="h-12 flex-1 rounded-md border border-input bg-background px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <button
            type="submit"
            className="h-12 rounded-md bg-brand px-6 font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Find pros
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Or call</span>
          <PhoneCTA
            phoneNumber={PHONE_NUMBER}
            displayNumber={PHONE_DISPLAY}
            location="country-hero"
            variant="ghost"
            size="sm"
          />
        </div>
      </SectionContainer>

      {/* How it works */}
      <SectionContainer as="section" aria-labelledby="how-it-works">
        <h2
          id="how-it-works"
          className="text-center text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          How it works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Three steps to a written quote from a licensed pro.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, idx) => (
            <Card key={step.title}>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
                  <step.icon className="size-5" aria-hidden />
                </div>
                <CardTitle className="mt-4 text-lg">
                  {idx + 1}. {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>

      {/* Pricing transparency */}
      <SectionContainer
        as="section"
        aria-labelledby="pricing"
        className="bg-muted/30"
      >
        <h2
          id="pricing"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          National HVAC cost ranges
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Typical price bands across major US metros. Local pricing varies with
          cost of living and climate load — your city page shows the local
          numbers.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {NATIONAL_PRICING.map((tier) => (
            <Card key={tier.key}>
              <CardHeader>
                <CardTitle className="text-base">{tier.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex items-baseline justify-between text-muted-foreground">
                  <span>Low</span>
                  <span>{fmtMoney.format(tier.low)}</span>
                </div>
                <div className="flex items-baseline justify-between font-medium">
                  <span>Median</span>
                  <span>{fmtMoney.format(tier.median)}</span>
                </div>
                <div className="flex items-baseline justify-between text-muted-foreground">
                  <span>High</span>
                  <span>{fmtMoney.format(tier.high)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>

      {/* Browse by state */}
      <SectionContainer as="section" aria-labelledby="browse-by-state">
        <h2
          id="browse-by-state"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Browse by state
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Pick your state to see local pricing, climate considerations, and
          city-level contractor listings.
        </p>
        <div
          aria-label="State grid"
          className="mx-auto mt-8 grid w-full max-w-3xl gap-1.5"
          style={{
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            gridTemplateRows: "repeat(8, minmax(2.25rem, auto))",
          }}
        >
          {allStateAbbrs.map((abbr) => {
            const [col, row] = STATE_GRID[abbr];
            const state = stateBySlug.get(abbr);
            const slug = state?.slug;
            const className = cn(
              "flex h-9 items-center justify-center rounded-md border border-border text-xs font-semibold transition-colors",
              slug
                ? "bg-background hover:border-brand hover:text-brand"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            );
            return slug ? (
              <Link
                key={abbr}
                href={`/${slug}`}
                title={state?.name ?? abbr}
                style={{ gridColumn: col, gridRow: row }}
                className={className}
              >
                {abbr}
              </Link>
            ) : (
              <span
                key={abbr}
                title={abbr}
                style={{ gridColumn: col, gridRow: row }}
                className={className}
              >
                {abbr}
              </span>
            );
          })}
        </div>
      </SectionContainer>

      {/* Top cities */}
      <SectionContainer
        as="section"
        aria-labelledby="top-cities"
        className="bg-muted/30"
      >
        <h2
          id="top-cities"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Top cities
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The largest US metros by population. Each city page lists local
          pricing, climate, and contractor availability.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCities.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.stateSlug}/${c.citySlug}`}
              className="group rounded-lg border border-border bg-background p-4 transition-colors hover:border-brand"
            >
              <div className="flex items-baseline justify-between">
                <p className="font-semibold tracking-tight group-hover:text-brand">
                  {c.cityName}
                </p>
                <Badge variant="secondary" className="font-mono text-xs">
                  {c.stateAbbr}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Population {fmtInt.format(c.population)}
              </p>
            </Link>
          ))}
        </div>
      </SectionContainer>

      {/* Trust signals */}
      <SectionContainer as="section" aria-labelledby="trust">
        <h2
          id="trust"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Vetted, licensed, accountable
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
                <ShieldCheck className="size-5" aria-hidden />
              </div>
              <CardTitle className="mt-4 text-lg">
                Licensed contractors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Current state HVAC licenses verified annually. EPA 608
                certification on every refrigerant-handling tech.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
                <CheckCircle2 className="size-5" aria-hidden />
              </div>
              <CardTitle className="mt-4 text-lg">
                2 million homeowners served
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Two million quote requests routed to local pros across the
                lower 48 states, Alaska, and Hawaii.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
                <BadgeCheck className="size-5" aria-hidden />
              </div>
              <CardTitle className="mt-4 text-lg">
                A+ accreditation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                BBB A+ accredited, Angi certified, and audited for licensing
                compliance every twelve months.
              </p>
            </CardContent>
          </Card>
        </div>
        <div
          aria-label="Trust badges"
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          <div className="rounded-md border border-border px-4 py-2">
            BBB A+
          </div>
          <div className="rounded-md border border-border px-4 py-2">
            Angi Certified
          </div>
          <div className="rounded-md border border-border px-4 py-2">
            EPA 608
          </div>
          <div className="rounded-md border border-border px-4 py-2">
            NATE Certified
          </div>
        </div>
      </SectionContainer>

      {/* FAQ */}
      <SectionContainer
        as="section"
        aria-labelledby="faq"
        className="bg-muted/30"
      >
        <h2 id="faq" className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <Accordion
          type="single"
          collapsible
          className="mx-auto mt-8 max-w-3xl"
        >
          {NATIONAL_FAQS.map((f, idx) => (
            <AccordionItem key={f.question} value={`faq-${idx}`}>
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

import Image from "next/image";
import Link from "next/link";
import {
  Users,
  ThermometerSun,
  Snowflake,
  Home,
  Wrench,
  Sun,
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
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SchemaInjector } from "@/components/seo/SchemaInjector";
import type { CityContent } from "@/lib/content/variants";
import type { City, State } from "@/lib/data/types";
import {
  buildFAQSchema,
  buildLocalBusinessAggregatorSchema,
  buildServiceSchema,
} from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

const fmtInt = new Intl.NumberFormat("en-US");
const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PHONE_NUMBER = "+18004822776";
const PHONE_DISPLAY = "1-800-HVAC-PRO";

const PRICING_KINDS = [
  { key: "repair", label: "Repair" },
  { key: "install", label: "Install" },
  { key: "maintenance", label: "Maintenance" },
  { key: "emergency", label: "Emergency" },
] as const;

interface CityPageProps {
  city: City;
  state: State;
  /** Cities near this one — usually 10-15. */
  nearestCities: City[];
  content: CityContent;
}

export function CityPage({ city, state, nearestCities, content }: CityPageProps) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: state.name, href: `/${state.slug}` },
    { label: `${city.cityName}, ${city.stateAbbr}` },
  ];

  const schemas = [
    buildServiceSchema({
      name: `HVAC contractors in ${city.cityName}, ${city.stateAbbr}`,
      areaServed: {
        "@type": "City",
        name: city.cityName,
        ...(city.lat && city.lng
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: city.lat,
                longitude: city.lng,
              },
            }
          : {}),
      },
      serviceType: "HVAC repair, replacement, and maintenance",
      description: `Compare licensed HVAC contractors in ${city.cityName}, ${city.stateAbbr}.`,
      url: `/${city.stateSlug}/${city.citySlug}`,
    }),
    buildFAQSchema(content.faqs),
    // BreadcrumbList is emitted by the <Breadcrumbs> component below.
    buildLocalBusinessAggregatorSchema(city),
  ];

  // Local data cards. We only render the ones we have data for, so the grid
  // stays dense and we never ship an empty "—" tile.
  const localCards: { icon: React.ElementType; label: string; value: string; note?: string }[] = [
    {
      icon: Users,
      label: "Population",
      value: fmtInt.format(city.population),
      note: city.county ? `${city.county} County` : undefined,
    },
  ];
  if (city.climate.avgHigh !== null && city.climate.avgLow !== null) {
    localCards.push({
      icon: ThermometerSun,
      label: "Climate snapshot",
      value: `${Math.round(city.climate.avgHigh)}°F / ${Math.round(city.climate.avgLow)}°F`,
      note: "Average high / low",
    });
  }
  if (city.climate.daysOver90 !== null) {
    localCards.push({
      icon: Sun,
      label: "Days above 90°F",
      value: fmtInt.format(Math.round(city.climate.daysOver90)),
      note: "Cooling-load proxy",
    });
  }
  if (city.climate.daysUnder32 !== null) {
    localCards.push({
      icon: Snowflake,
      label: "Days below 32°F",
      value: fmtInt.format(Math.round(city.climate.daysUnder32)),
      note: "Heating-load proxy",
    });
  }
  if (city.housing.medianHomeValue !== null) {
    localCards.push({
      icon: Home,
      label: "Median home value",
      value: fmtMoney.format(city.housing.medianHomeValue),
      note: city.housing.medianIncome
        ? `Median income ${fmtMoney.format(city.housing.medianIncome)}`
        : undefined,
    });
  }
  if (city.pricing) {
    localCards.push({
      icon: Wrench,
      label: "Average repair cost",
      value: fmtMoney.format(city.pricing.repair.median),
      note: `Range ${fmtMoney.format(city.pricing.repair.low)} – ${fmtMoney.format(city.pricing.repair.high)}`,
    });
  }

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapSrc = mapsKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${city.lat},${city.lng}&zoom=11&size=600x300&scale=2&maptype=roadmap&key=${mapsKey}`
    : null;
  const mapAlt = `Map showing ${city.cityName}, ${city.stateName}`;

  return (
    <>
      <SchemaInjector schemas={schemas} />

      <SectionContainer tight>
        <Breadcrumbs items={breadcrumbItems} />
      </SectionContainer>

      {/* Hero */}
      <SectionContainer className="pt-2">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="text-sm font-medium uppercase tracking-wider text-brand">
              {city.cityName}, {city.stateName}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              HVAC contractors in {city.cityName}, {city.stateAbbr}. Get free
              quotes.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {content.intro}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary">
                Population {fmtInt.format(city.population)}
              </Badge>
              {city.county && (
                <Badge variant="secondary">{city.county} County</Badge>
              )}
              {city.primary_zip && (
                <Badge variant="secondary">ZIP {city.primary_zip}</Badge>
              )}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Talk to a dispatcher</span>
              <PhoneCTA
                phoneNumber={PHONE_NUMBER}
                displayNumber={PHONE_DISPLAY}
                location={`city-hero-${city.slug}`}
                variant="ghost"
                size="sm"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div
              id="lead-form-mount"
              data-lead-form-mount
              data-city-slug={city.citySlug}
              data-state-slug={city.stateSlug}
              data-primary-zip={city.primary_zip}
              className="rounded-lg border border-border bg-muted/30 p-6"
            >
              <p className="text-sm font-semibold tracking-tight">
                Request a free quote
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Lead form mounts here. We match within an hour during business
                days.
              </p>
              <div className="mt-4 h-48 rounded-md border border-dashed border-border" />
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Local data */}
      <SectionContainer
        as="section"
        aria-labelledby="city-stats"
        className="bg-muted/30"
      >
        <h2
          id="city-stats"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {city.cityName} at a glance
        </h2>
        <div
          className={cn(
            "mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {localCards.map((c) => (
            <Card key={c.label}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <c.icon className="size-5 text-brand" aria-hidden />
                  <CardTitle className="text-sm text-muted-foreground">
                    {c.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{c.value}</p>
                {c.note && (
                  <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>

      {/* Pricing */}
      <SectionContainer as="section" aria-labelledby="city-pricing">
        <h2
          id="city-pricing"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {city.cityName} HVAC pricing
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Local price bands for the most common service types. Pricing reflects
          {city.pricing?.acSurcharge ? " a cooling-demand adjustment" : ""}
          {city.pricing?.heatSurcharge ? " a heating-demand adjustment" : ""}
          {!city.pricing?.acSurcharge && !city.pricing?.heatSurcharge
            ? " regional labor and cost-of-living factors"
            : ""}
          .
        </p>
        {city.pricing ? (
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {PRICING_KINDS.map((kind) => {
              const tier = city.pricing![kind.key];
              return (
                <Card key={kind.key}>
                  <CardHeader>
                    <CardTitle className="text-base">{kind.label}</CardTitle>
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
              );
            })}
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            Local pricing publishes after the data pipeline runs.
          </p>
        )}
      </SectionContainer>

      {/* Why this city matters */}
      <SectionContainer
        as="section"
        aria-labelledby="why-city"
        className="bg-muted/30"
      >
        <div className="mx-auto max-w-3xl">
          <h2
            id="why-city"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Why HVAC equipment works hard in {city.cityName}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-foreground">
            {content.whyCityMatters}
          </p>
        </div>
      </SectionContainer>

      {/* Seasonality */}
      <SectionContainer as="section" aria-labelledby="seasonality">
        <div className="mx-auto max-w-3xl">
          <h2
            id="seasonality"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Seasonal service timing
          </h2>
          <p className="mt-6 text-base leading-relaxed text-foreground">
            {content.seasonality}
          </p>
        </div>
      </SectionContainer>

      {/* Map */}
      <SectionContainer
        as="section"
        aria-labelledby="city-map"
        className="bg-muted/30"
      >
        <h2
          id="city-map"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Service area
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Coverage centered on {city.cityName}, {city.stateName}.
        </p>
        <div className="mt-8 overflow-hidden rounded-lg border border-border bg-background">
          {mapSrc ? (
            <Image
              src={mapSrc}
              alt={mapAlt}
              width={1200}
              height={600}
              sizes="(min-width: 768px) 600px, 100vw"
              className="h-auto w-full"
              unoptimized
            />
          ) : (
            <div
              role="img"
              aria-label={mapAlt}
              className="flex h-48 items-center justify-center bg-muted text-sm text-muted-foreground sm:h-64"
            >
              Map preview unavailable. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to
              enable the static map.
            </div>
          )}
        </div>
      </SectionContainer>

      {/* FAQ */}
      <SectionContainer as="section" aria-labelledby="city-faq">
        <h2
          id="city-faq"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {city.cityName} HVAC questions
        </h2>
        <Accordion
          type="single"
          collapsible
          className="mx-auto mt-8 max-w-3xl"
        >
          {content.faqs.map((f, idx) => (
            <AccordionItem key={f.question} value={`city-faq-${idx}`}>
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

      {/* Nearby cities */}
      <SectionContainer
        as="section"
        aria-labelledby="nearby-cities"
        className="bg-muted/30"
      >
        <h2
          id="nearby-cities"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Nearby cities
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Also serving these metros near {city.cityName}.
        </p>
        {nearestCities.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            Nearby city data publishes after the data pipeline runs.
          </p>
        ) : (
          <ul className="mt-8 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {nearestCities.slice(0, 15).map((c) => (
              <li key={c.slug} className="min-w-[12rem] sm:min-w-0">
                <Link
                  href={`/${c.stateSlug}/${c.citySlug}`}
                  className="group block rounded-lg border border-border bg-background p-4 transition-colors hover:border-brand"
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
              </li>
            ))}
          </ul>
        )}
      </SectionContainer>
    </>
  );
}

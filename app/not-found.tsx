import Link from "next/link";

import { SectionContainer } from "@/components/layout/SectionContainer";
import { PhoneCTA } from "@/components/ui/PhoneCTA";
import { getAllStates } from "@/lib/data";

export const metadata = {
  title: "Page Not Found",
  description: "We could not find that page. Try a state, search by ZIP, or call us.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  const states = getAllStates();

  return (
    <SectionContainer className="text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-brand">
        404
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        We could not find that page.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
        The page you requested may have moved or never existed. Try a ZIP code,
        pick a state below, or call us directly.
      </p>

      <form
        action="/find-pros"
        method="get"
        aria-label="ZIP code lookup"
        className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="notfound-zip" className="sr-only">
          ZIP code
        </label>
        <input
          id="notfound-zip"
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
          phoneNumber="+18004822776"
          displayNumber="1-800-HVAC-PRO"
          location="not-found"
          variant="ghost"
          size="sm"
        />
      </div>

      <div className="mt-12 text-left">
        <Link
          href="/"
          className="text-sm font-medium text-brand hover:underline"
        >
          ← Back to homepage
        </Link>
        <p className="mt-8 text-sm font-semibold tracking-tight">
          Browse by state
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 md:grid-cols-4">
          {states.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/${s.slug}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SectionContainer>
  );
}

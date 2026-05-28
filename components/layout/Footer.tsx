import Link from "next/link";
import { getAllStates, getTopCitiesNationally } from "@/lib/data";

const SOCIAL_LINKS = [
  { href: "#", label: "Facebook" },
  { href: "#", label: "X" },
  { href: "#", label: "LinkedIn" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/ccpa", label: "CCPA" },
  { href: "/tcpa-consent", label: "TCPA Consent" },
];

export function Footer() {
  const states = getAllStates();
  const topCities = getTopCitiesNationally(25);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <p className="text-base font-semibold tracking-tight">
              HVAC Pros Network
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Licensed, vetted local HVAC contractors across the United States.
              Free quotes for repair, replacement, and maintenance.
            </p>
            <address className="space-y-1 text-sm not-italic text-muted-foreground">
              <div>HVAC Pros Network</div>
              <div>Nationwide service area</div>
              <div>United States</div>
            </address>
            <ul className="flex gap-4 text-sm text-muted-foreground">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.label}>
                  <Link
                    href={s.href}
                    aria-label={s.label}
                    className="transition-colors hover:text-foreground"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Browse by state">
            <p className="text-base font-semibold tracking-tight">
              Browse by State
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
          </nav>

          <nav aria-label="Top cities">
            <p className="text-base font-semibold tracking-tight">Top Cities</p>
            <ul className="mt-4 grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 md:grid-cols-1">
              {topCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/${c.stateSlug}/${c.citySlug}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {c.cityName}, {c.stateAbbr}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>© {year} HVAC Pros Network. All rights reserved.</div>
          <ul className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

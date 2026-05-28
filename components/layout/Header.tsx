import Link from "next/link";
import { PhoneCTA } from "@/components/ui/PhoneCTA";
import { MobileNav, type MobileNavLink } from "./MobileNav";

const NAV_LINKS: MobileNavLink[] = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
];

const PHONE_NUMBER = "+18004822776";
const PHONE_DISPLAY = "1-800-HVAC-PRO";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg"
        >
          HVAC Pros Network
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 text-sm font-medium md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <PhoneCTA
            phoneNumber={PHONE_NUMBER}
            displayNumber={PHONE_DISPLAY}
            location="header"
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
          />
          <MobileNav
            links={NAV_LINKS}
            phoneNumber={PHONE_NUMBER}
            phoneDisplay={PHONE_DISPLAY}
            className="md:hidden"
          />
        </div>
      </div>
    </header>
  );
}

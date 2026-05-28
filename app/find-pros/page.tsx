import type { Metadata } from "next";

import { LeadForm } from "@/components/forms/LeadForm";
import { SectionContainer } from "@/components/layout/SectionContainer";

export const metadata: Metadata = {
  title: "Find HVAC Pros",
  description:
    "Get matched with licensed HVAC contractors. Free quotes in your ZIP code.",
  robots: { index: false, follow: false },
};

export default function FindProsPage() {
  return (
    <SectionContainer>
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-medium uppercase tracking-wider text-brand">
          Free quote
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Find HVAC pros near you.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Six quick questions. A licensed pro will reach out within the hour
          during business days.
        </p>
        <div className="mt-8 rounded-lg border border-border bg-background p-5 sm:p-6">
          <LeadForm />
        </div>
      </div>
    </SectionContainer>
  );
}

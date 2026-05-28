import { PhoneCTA } from "@/components/ui/PhoneCTA";
import { SectionContainer } from "@/components/layout/SectionContainer";

export default function Home() {
  return (
    <>
      <SectionContainer className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-brand">
          Local HVAC Pros, Nationwide
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Find a vetted HVAC contractor near you.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Licensed technicians for repair, replacement, and seasonal
          maintenance. Free quotes within an hour during business days.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PhoneCTA
            phoneNumber="+18004822776"
            displayNumber="1-800-HVAC-PRO"
            location="homepage-hero"
            variant="primary"
            size="lg"
          />
          <PhoneCTA
            phoneNumber="+18004822776"
            displayNumber="Request a quote online"
            location="homepage-hero-secondary"
            variant="ghost"
            size="lg"
            showIcon={false}
          />
        </div>
      </SectionContainer>
    </>
  );
}

import { SectionContainer } from "@/components/layout/SectionContainer";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/**
 * Shared chrome for the four legal pages. Renders prose at a constrained
 * measure (max-w-3xl) with a clear last-updated stamp at the top.
 */
export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <SectionContainer>
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
        <div className="prose-styled mt-8 space-y-6 text-base leading-relaxed text-foreground">
          {children}
        </div>
      </article>
    </SectionContainer>
  );
}

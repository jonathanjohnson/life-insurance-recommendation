"use client";

import { useEffect } from "react";
import Link from "next/link";

import { SectionContainer } from "@/components/layout/SectionContainer";
import { Button } from "@/components/ui/button";
import { PhoneCTA } from "@/components/ui/PhoneCTA";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to client console; Vercel Analytics + a real error reporter
    // (Sentry, etc.) wire up here later.
    console.error(error);
  }, [error]);

  return (
    <SectionContainer className="text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-brand">
        Something went wrong
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        That page hit an error.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
        The page failed to load. Try again, head back to the homepage, or call
        a dispatcher to start a quote by phone.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      )}

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button onClick={reset} size="lg">
          Try again
        </Button>
        <Link
          href="/"
          className="text-sm font-medium text-brand hover:underline"
        >
          ← Back to homepage
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Or call</span>
        <PhoneCTA
          phoneNumber="+18004822776"
          displayNumber="1-800-HVAC-PRO"
          location="error-boundary"
          variant="ghost"
          size="sm"
        />
      </div>
    </SectionContainer>
  );
}

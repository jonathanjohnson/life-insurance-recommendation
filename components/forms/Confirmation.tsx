"use client";

import { CheckCircle2 } from "lucide-react";

import { PhoneCTA } from "@/components/ui/PhoneCTA";

interface ConfirmationProps {
  /** Estimated callback window, e.g. "60 minutes". */
  callbackWindow?: string;
}

export function Confirmation({ callbackWindow = "60 minutes" }: ConfirmationProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand">
        <CheckCircle2 className="size-6" aria-hidden />
      </div>
      <div>
        <p className="text-lg font-semibold tracking-tight">Got it.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          A licensed pro will reach out within {callbackWindow} during business
          hours. Watch your phone and email.
        </p>
      </div>
      <div className="pt-2">
        <p className="text-xs text-muted-foreground">Or skip the wait</p>
        <PhoneCTA
          phoneNumber="+18004822776"
          displayNumber="1-800-HVAC-PRO"
          location="confirmation"
          variant="primary"
          size="md"
          className="mt-2"
        />
      </div>
    </div>
  );
}

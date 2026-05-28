"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import {
  type LeadContext,
  type LeadFormValues,
  type LeadMeta,
  type LeadPayload,
  TCPA_CONSENT_TEXT,
  TOTAL_STEPS,
  leadFormSchema,
  stepFields,
} from "@/lib/forms/leadSchema";

import { Confirmation } from "./Confirmation";
import { Step1Zip } from "./steps/Step1Zip";
import { Step2Service } from "./steps/Step2Service";
import { Step3Urgency } from "./steps/Step3Urgency";
import { Step4System } from "./steps/Step4System";
import { Step5Contact } from "./steps/Step5Contact";
import { Step6Email } from "./steps/Step6Email";

const STEP_TITLES: Record<number, string> = {
  1: "Step 1 of 6 — ZIP",
  2: "Step 2 of 6 — Service",
  3: "Step 3 of 6 — Timing",
  4: "Step 4 of 6 — System",
  5: "Step 5 of 6 — Contact",
  6: "Step 6 of 6 — Email & verify",
};

const UTM_KEYS: (keyof LeadMeta)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

export interface LeadFormProps {
  initialZip?: string;
  cityContext?: { slug: string; name: string };
  stateContext?: { slug: string; name: string; abbr: string };
}

export function LeadForm({
  initialZip,
  cityContext,
  stateContext,
}: LeadFormProps) {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const partialSavedRef = useRef(false);
  const metaRef = useRef<LeadMeta>({});

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    mode: "onSubmit",
    defaultValues: {
      zip: initialZip ?? "",
      service_type: "" as LeadFormValues["service_type"],
      urgency: "" as LeadFormValues["urgency"],
      system_type: "" as LeadFormValues["system_type"],
      property_type: "" as LeadFormValues["property_type"],
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      tcpa_consent: false,
      turnstile_token: "",
    },
  });

  // Capture UTM params and source URL on first render. Done lazily inside
  // useEffect so SSR is happy (window/URLSearchParams are client-only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const meta: LeadMeta = { source_url: url.href };
    for (const k of UTM_KEYS) {
      const v = url.searchParams.get(k);
      if (v) meta[k] = v;
    }
    metaRef.current = meta;

    // ?zip= override (used by /find-pros). Only set if not already filled.
    const queryZip = url.searchParams.get("zip");
    if (queryZip && /^\d{5}$/.test(queryZip) && !form.getValues("zip")) {
      form.setValue("zip", queryZip);
    }
  }, [form]);

  const stepNode = useMemo(() => {
    switch (step) {
      case 1:
        return <Step1Zip />;
      case 2:
        return <Step2Service />;
      case 3:
        return <Step3Urgency />;
      case 4:
        return <Step4System />;
      case 5:
        return <Step5Contact />;
      case 6:
        return <Step6Email />;
      default:
        return null;
    }
  }, [step]);

  const buildContext = (): LeadContext => ({
    city_slug: cityContext?.slug,
    state_slug: stateContext?.slug,
    city_name: cityContext?.name,
    state_name: stateContext?.name,
    state_abbr: stateContext?.abbr,
  });

  async function firePartialSave() {
    if (partialSavedRef.current) return;
    const values = form.getValues();
    const payload = {
      partial: true,
      zip: values.zip,
      service_type: values.service_type,
      urgency: values.urgency,
      system_type: values.system_type,
      property_type: values.property_type,
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone,
      tcpa_consent: false,
      tcpa_consent_text: TCPA_CONSENT_TEXT,
      tcpa_consent_user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : "",
      system_details: {
        system_type: values.system_type,
        property_type: values.property_type,
      },
      turnstile_token: "",
      ...buildContext(),
      ...metaRef.current,
    };
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      partialSavedRef.current = true;
    } catch {
      // Non-blocking — partial saves are best-effort.
    }
  }

  async function handleNext() {
    setSubmitError(null);
    const fields = stepFields[step];
    const valid = await form.trigger(fields);
    if (!valid) return;

    // Step 5 → 6 transition: fire partial-save so we capture the
    // phone-bearing record before the user can abandon at email.
    if (step === 5) {
      await firePartialSave();
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function handleBack() {
    setSubmitError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function onSubmit(values: LeadFormValues) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: LeadPayload = {
        ...values,
        ...buildContext(),
        ...metaRef.current,
        tcpa_consent: values.tcpa_consent,
        tcpa_consent_text: TCPA_CONSENT_TEXT,
        tcpa_consent_user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : "",
        turnstile_token: values.turnstile_token,
        partial: false,
        system_details: {
          system_type: values.system_type,
          property_type: values.property_type,
        },
      };
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting your request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <Confirmation />;
  }

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);
  const isLastStep = step === TOTAL_STEPS;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        aria-label="Lead capture form"
        className="space-y-5"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {STEP_TITLES[step]}
          </p>
          <Progress value={progressPct} className="mt-2 h-1.5" />
        </div>

        <div key={`step-${step}`}>{stepNode}</div>

        {submitError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {submitError}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          {step > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={handleBack}
              disabled={submitting}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Button>
          )}
          <div className="ml-auto">
            {isLastStep ? (
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={handleNext}
                disabled={submitting}
              >
                Next
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

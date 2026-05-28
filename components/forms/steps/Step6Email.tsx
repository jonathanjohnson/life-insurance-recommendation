"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type LeadFormValues, TCPA_CONSENT_TEXT } from "@/lib/forms/leadSchema";

// Cloudflare-published test sitekey that always passes. Used in dev /
// preview environments without a real key configured.
const TEST_SITE_KEY = "1x00000000000000000000AA";

export function Step6Email() {
  const form = useFormContext<LeadFormValues>();
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;

  return (
    <div className="space-y-5">
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Email address</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 text-base"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-md border border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        {TCPA_CONSENT_TEXT}
      </div>

      <FormField
        control={form.control}
        name="tcpa_consent"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={field.value === true}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="mt-1 size-4 rounded border-input text-brand focus:ring-2 focus:ring-ring"
                  aria-describedby="tcpa-consent-error"
                />
                <span>
                  I agree to the consent statement above and to be contacted by
                  HVAC Pros Network and its partners.
                </span>
              </label>
            </FormControl>
            <div id="tcpa-consent-error">
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="turnstile_token"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Verification</FormLabel>
            <FormControl>
              <div>
                <Turnstile
                  siteKey={siteKey}
                  onSuccess={(token) => field.onChange(token)}
                  onError={() => field.onChange("")}
                  onExpire={() => field.onChange("")}
                  options={{ theme: "light", size: "flexible" }}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

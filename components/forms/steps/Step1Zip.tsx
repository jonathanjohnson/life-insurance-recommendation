"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { LeadFormValues } from "@/lib/forms/leadSchema";

export function Step1Zip() {
  const form = useFormContext<LeadFormValues>();
  return (
    <FormField
      control={form.control}
      name="zip"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">
            What&apos;s your ZIP code?
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              autoFocus
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              placeholder="12345"
              className="h-12 text-base"
              autoComplete="postal-code"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

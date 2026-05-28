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

export function Step5Contact() {
  const form = useFormContext<LeadFormValues>();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">First name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoFocus
                  autoComplete="given-name"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Last name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="family-name"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Phone number</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                className="h-12 text-base"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

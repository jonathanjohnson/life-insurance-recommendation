"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type LeadFormValues, SERVICE_TYPES } from "@/lib/forms/leadSchema";

export function Step2Service() {
  const form = useFormContext<LeadFormValues>();
  return (
    <FormField
      control={form.control}
      name="service_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">What kind of service?</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ""}>
            <FormControl>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {SERVICE_TYPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

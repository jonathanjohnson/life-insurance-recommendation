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
import {
  type LeadFormValues,
  PROPERTY_TYPES,
  SYSTEM_TYPES,
} from "@/lib/forms/leadSchema";

export function Step4System() {
  const form = useFormContext<LeadFormValues>();
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="system_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">System type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SYSTEM_TYPES.map((s) => (
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
      <FormField
        control={form.control}
        name="property_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Property type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PROPERTY_TYPES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

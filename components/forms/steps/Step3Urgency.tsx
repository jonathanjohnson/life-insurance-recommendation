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
import { type LeadFormValues, URGENCY } from "@/lib/forms/leadSchema";

export function Step3Urgency() {
  const form = useFormContext<LeadFormValues>();
  return (
    <FormField
      control={form.control}
      name="urgency"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">When do you need help?</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ""}>
            <FormControl>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {URGENCY.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
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

import { z } from "zod";

/**
 * Single zod schema for the multi-step lead form. Each Next-button click
 * validates only that step's slice via form.trigger(stepFields[step]).
 * The full schema is also reused server-side at /api/lead.
 */

export const SERVICE_TYPES = [
  { value: "repair", label: "Repair" },
  { value: "installation", label: "Installation / Replacement" },
  { value: "maintenance", label: "Maintenance / Tune-up" },
  { value: "emergency", label: "Emergency" },
  { value: "not-sure", label: "Not sure yet" },
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];

export const URGENCY = [
  { value: "today", label: "Today (emergency)" },
  { value: "week", label: "Within a week" },
  { value: "month", label: "Within a month" },
  { value: "researching", label: "Just researching" },
] as const;
export type Urgency = (typeof URGENCY)[number]["value"];

export const SYSTEM_TYPES = [
  { value: "central-ac", label: "Central AC" },
  { value: "heat-pump", label: "Heat pump" },
  { value: "furnace", label: "Furnace" },
  { value: "boiler", label: "Boiler" },
  { value: "mini-split", label: "Mini-split / Ductless" },
  { value: "multiple", label: "Multiple systems" },
  { value: "not-sure", label: "Not sure" },
] as const;
export type SystemType = (typeof SYSTEM_TYPES)[number]["value"];

export const PROPERTY_TYPES = [
  { value: "single-family", label: "Single family" },
  { value: "townhouse", label: "Townhouse" },
  { value: "condo", label: "Condo" },
  { value: "multi-family", label: "Multi-family" },
  { value: "commercial", label: "Commercial" },
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];

// Canonical TCPA copy lives next to the server-side audit code; re-export
// so existing form imports keep working.
export { TCPA_CONSENT_TEXT } from "@/lib/lead-routing/tcpa";

const enumZ = <T extends readonly { value: string }[]>(opts: T) =>
  z.enum(opts.map((o) => o.value) as [string, ...string[]]);

const phoneSchema = z
  .string()
  .min(1, "Phone is required")
  .refine(
    (v) => v.replace(/\D/g, "").length === 10,
    "Enter a 10-digit US phone number",
  );

export const leadFormSchema = z.object({
  // Step 1
  zip: z
    .string()
    .regex(/^\d{5}$/, "Enter a 5-digit ZIP code"),

  // Step 2
  service_type: enumZ(SERVICE_TYPES).refine((v) => v.length > 0, {
    message: "Pick a service type",
  }),

  // Step 3
  urgency: enumZ(URGENCY).refine((v) => v.length > 0, {
    message: "Pick a timeframe",
  }),

  // Step 4
  system_type: enumZ(SYSTEM_TYPES).refine((v) => v.length > 0, {
    message: "Pick a system type",
  }),
  property_type: enumZ(PROPERTY_TYPES).refine((v) => v.length > 0, {
    message: "Pick a property type",
  }),

  // Step 5
  first_name: z.string().min(1, "First name is required").max(60),
  last_name: z.string().min(1, "Last name is required").max(60),
  phone: phoneSchema,

  // Step 6
  email: z.string().email("Enter a valid email"),
  tcpa_consent: z
    .boolean()
    .refine((v) => v === true, "Consent is required to submit"),
  turnstile_token: z.string().min(1, "Verification required"),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const TOTAL_STEPS = 6;

export const stepFields: Record<number, (keyof LeadFormValues)[]> = {
  1: ["zip"],
  2: ["service_type"],
  3: ["urgency"],
  4: ["system_type", "property_type"],
  5: ["first_name", "last_name", "phone"],
  6: ["email", "tcpa_consent", "turnstile_token"],
};

export type LeadContext = {
  city_slug?: string;
  state_slug?: string;
  city_name?: string;
  state_name?: string;
  state_abbr?: string;
};

export type LeadMeta = {
  source_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

/**
 * Final lead payload posted to /api/lead. Mirrors the leads table in
 * supabase/migrations/0001_initial_schema.sql.
 */
export type LeadPayload = Omit<LeadFormValues, "tcpa_consent" | "turnstile_token"> &
  LeadContext &
  LeadMeta & {
    tcpa_consent: boolean;
    tcpa_consent_text: string;
    tcpa_consent_user_agent: string;
    turnstile_token: string;
    partial: boolean;
    system_details: { system_type: string; property_type: string };
  };

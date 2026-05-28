import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fireLeadSubmitEvent } from "@/lib/lead-routing/analytics";
import { checkRateLimit } from "@/lib/lead-routing/rateLimit";
import { routeLead } from "@/lib/lead-routing/router";
import { isLikelySpam } from "@/lib/lead-routing/spam";
import {
  TCPA_CONSENT_TEXT,
  getClientIp,
  getUserAgent,
} from "@/lib/lead-routing/tcpa";
import { verifyTurnstile } from "@/lib/lead-routing/turnstile";
import { insertLead, updateLeadRouting } from "@/lib/supabase/queries";
import type { Json, LeadInsert } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const baseSchema = z.object({
  zip: z.string().regex(/^\d{5}$/, "Invalid ZIP"),
  city_slug: z.string().optional(),
  state_slug: z.string().optional(),
  city_name: z.string().optional(),
  state_name: z.string().optional(),
  state_abbr: z.string().optional(),

  service_type: z.string().optional(),
  urgency: z.string().optional(),
  property_type: z.string().optional(),
  system_type: z.string().optional(),
  system_details: z.record(z.string(), z.unknown()).optional(),

  first_name: z.string().min(1, "First name required").max(60),
  last_name: z.string().min(1, "Last name required").max(60),
  phone: z
    .string()
    .refine((v) => v.replace(/\D/g, "").length === 10, "Invalid phone"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),

  tcpa_consent: z.boolean().default(false),
  tcpa_consent_text: z.string().optional(),
  tcpa_consent_user_agent: z.string().optional(),
  turnstile_token: z.string().optional().default(""),

  source_url: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),

  partial: z.boolean().default(false),
});

const fullSubmissionRefinement = baseSchema.superRefine((data, ctx) => {
  if (data.partial) return;
  if (!data.email || data.email.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "Email required for full submission",
    });
  }
  if (data.tcpa_consent !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tcpa_consent"],
      message: "TCPA consent required for full submission",
    });
  }
  if (!data.turnstile_token || data.turnstile_token.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["turnstile_token"],
      message: "Verification required for full submission",
    });
  }
});

type ParsedBody = z.infer<typeof baseSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildLeadInsert(
  data: ParsedBody,
  meta: { ip: string; userAgent: string; partial: boolean },
): LeadInsert {
  return {
    zip: data.zip,
    city_slug: data.city_slug ?? "",
    state_slug: data.state_slug ?? "",

    service_type: data.service_type ?? null,
    urgency: data.urgency ?? null,
    property_type: data.property_type ?? null,
    system_details:
      (data.system_details as Json | undefined) ??
      (data.system_type
        ? ({
            system_type: data.system_type,
            property_type: data.property_type ?? "",
          } as Json)
        : null),

    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone,
    email: data.email && data.email.length > 0 ? data.email : "",

    tcpa_consent: meta.partial ? false : data.tcpa_consent,
    tcpa_consent_text: data.tcpa_consent_text ?? TCPA_CONSENT_TEXT,
    tcpa_consent_ip: meta.ip,
    tcpa_consent_user_agent: data.tcpa_consent_user_agent ?? meta.userAgent,

    source_url: data.source_url ?? null,
    utm_source: data.utm_source ?? null,
    utm_medium: data.utm_medium ?? null,
    utm_campaign: data.utm_campaign ?? null,
    utm_term: data.utm_term ?? null,
    utm_content: data.utm_content ?? null,

    routing_status: "pending",
    partial: meta.partial,
  };
}

function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: message, details },
    { status: 400 },
  );
}

// ---------------------------------------------------------------------------
// POST /api/lead
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // 1. Rate limit before any work.
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  // 2. Parse + validate.
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const parsed = fullSubmissionRefinement.safeParse(rawBody);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }
  const data = parsed.data;
  const userAgent = getUserAgent(request);

  // 3. Turnstile (full only).
  if (!data.partial) {
    const verify = await verifyTurnstile(data.turnstile_token ?? "", ip);
    if (!verify.ok) {
      return NextResponse.json(
        { ok: false, error: `Verification failed: ${verify.reason}` },
        { status: 403 },
      );
    }
  }

  // 4. Spam heuristics.
  const spam = isLikelySpam({
    zip: data.zip,
    phone: data.phone,
    email: data.email ?? "",
    first_name: data.first_name,
    last_name: data.last_name,
  });

  // 5. Insert. Failures here are the only thing that 5xx's the client —
  //    everything downstream is best-effort.
  const insertPayload = buildLeadInsert(data, {
    ip,
    userAgent,
    partial: data.partial,
  });
  if (spam.flagged) {
    insertPayload.routing_status = "spam_flagged";
  }

  let lead;
  try {
    lead = await insertLead(insertPayload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Database insert failed";
    return NextResponse.json(
      { ok: false, error: "Could not record lead", detail: message },
      { status: 500 },
    );
  }

  // 6. Early exits: partial leads + spam-flagged leads don't route.
  if (data.partial) {
    return NextResponse.json(
      {
        ok: true,
        id: lead.id,
        partial: true,
        routing_status: lead.routing_status,
      },
      { status: 200 },
    );
  }

  if (spam.flagged) {
    return NextResponse.json(
      {
        ok: true,
        id: lead.id,
        partial: false,
        routing_status: "spam_flagged",
        spam_reasons: spam.reasons,
      },
      { status: 200 },
    );
  }

  // 7. Route.
  let routingStatus = "pending";
  try {
    const result = await routeLead(lead);
    routingStatus = result.status;
    try {
      await updateLeadRouting(
        lead.id,
        result.status,
        result.destination,
        (result.response ?? null) as Json,
      );
    } catch {
      // Best-effort: routing result already captured in lead_routing_log.
    }
  } catch {
    routingStatus = "failed";
  }

  // 8. GA4 fire-and-forget.
  void fireLeadSubmitEvent({
    leadId: lead.id,
    citySlug: data.city_slug,
    stateSlug: data.state_slug,
    serviceType: data.service_type,
    urgency: data.urgency,
    systemType: data.system_type,
    partial: false,
  });

  return NextResponse.json(
    {
      ok: true,
      id: lead.id,
      partial: false,
      routing_status: routingStatus,
    },
    { status: 200 },
  );
}

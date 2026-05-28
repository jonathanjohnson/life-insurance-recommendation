/**
 * Lead routing engine. Two destinations:
 *   1. A matched contractor (by ZIP + service_type) via webhook
 *   2. Aggregator fallback via AGGREGATOR_LEAD_ENDPOINT
 *
 * Per-attempt rows land in lead_routing_log so we can debug failed
 * routes without losing the lead itself. Every external POST runs
 * under a 2.5s AbortController timeout — the lead is already in
 * Supabase, so a slow buyer never blocks the client response.
 */
import {
  getContractorForZip,
  logRoutingAttempt,
} from "@/lib/supabase/queries";
import type { Contractor, Json, Lead } from "@/lib/supabase/types";

const POST_TIMEOUT_MS = 2_500;

export type RoutingStatus =
  | "routed"
  | "failed"
  | "no_destination"
  | "skipped";

export interface RoutingResult {
  status: RoutingStatus;
  destination: string;
  response: unknown;
}

interface PostResult {
  ok: boolean;
  status: number;
  body: string;
  durationMs: number;
  errorMessage?: string;
}

async function timedPost(
  url: string,
  payload: unknown,
  headers: Record<string, string>,
): Promise<PostResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      body: body.slice(0, 4_000),
      durationMs: Date.now() - started,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: "",
      durationMs: Date.now() - started,
      errorMessage: err instanceof Error ? err.message : "unknown error",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function buildContractorPayload(lead: Lead): Record<string, unknown> {
  return {
    lead_id: lead.id,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    zip: lead.zip,
    city_slug: lead.city_slug,
    state_slug: lead.state_slug,
    service_type: lead.service_type,
    urgency: lead.urgency,
    property_type: lead.property_type,
    system_details: lead.system_details,
    source_url: lead.source_url,
    utm_source: lead.utm_source,
    utm_medium: lead.utm_medium,
    utm_campaign: lead.utm_campaign,
    utm_term: lead.utm_term,
    utm_content: lead.utm_content,
    tcpa_consent: lead.tcpa_consent,
    tcpa_consent_text: lead.tcpa_consent_text,
    tcpa_consent_ip: lead.tcpa_consent_ip,
    tcpa_consent_user_agent: lead.tcpa_consent_user_agent,
    captured_at: lead.created_at,
  };
}

/**
 * Modernize / Networx-style mapping. Real integrations will refine
 * field names once the buyer spec is finalized.
 */
export function buildAggregatorPayload(lead: Lead): Record<string, unknown> {
  const phoneDigits = (lead.phone ?? "").replace(/\D/g, "");
  return {
    vendor: "hvac-pros-network",
    lead_id: lead.id,
    contact: {
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: phoneDigits,
    },
    location: {
      zip: lead.zip,
      city: lead.city_slug,
      state: lead.state_slug,
    },
    project: {
      vertical: "hvac",
      service: lead.service_type,
      urgency: lead.urgency,
      property_type: lead.property_type,
      system_details: lead.system_details,
    },
    consent: {
      tcpa: lead.tcpa_consent,
      text: lead.tcpa_consent_text,
      ip: lead.tcpa_consent_ip,
      user_agent: lead.tcpa_consent_user_agent,
      captured_at: lead.created_at,
    },
    attribution: {
      source_url: lead.source_url,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_term: lead.utm_term,
      utm_content: lead.utm_content,
    },
  };
}

async function tryContractor(
  contractor: Contractor,
  lead: Lead,
): Promise<RoutingResult | null> {
  if (!contractor.webhook_url) return null;
  const payload = buildContractorPayload(lead);
  const result = await timedPost(contractor.webhook_url, payload, {});

  try {
    await logRoutingAttempt({
      lead_id: lead.id,
      destination_type: "contractor",
      destination_id: contractor.id,
      endpoint: contractor.webhook_url,
      request_payload: payload as Json,
      response_status: result.status,
      response_body: result.errorMessage ?? result.body,
      duration_ms: result.durationMs,
    });
  } catch {
    // Best-effort logging.
  }

  if (result.ok) {
    return {
      status: "routed",
      destination: `contractor:${contractor.id}`,
      response: { status: result.status, body: result.body },
    };
  }
  return null;
}

async function tryAggregator(lead: Lead): Promise<RoutingResult | null> {
  const endpoint = process.env.AGGREGATOR_LEAD_ENDPOINT;
  const apiKey = process.env.AGGREGATOR_API_KEY;
  if (!endpoint) return null;

  const payload = buildAggregatorPayload(lead);
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const result = await timedPost(endpoint, payload, headers);

  try {
    await logRoutingAttempt({
      lead_id: lead.id,
      destination_type: "aggregator",
      destination_id: "aggregator",
      endpoint,
      request_payload: payload as Json,
      response_status: result.status,
      response_body: result.errorMessage ?? result.body,
      duration_ms: result.durationMs,
    });
  } catch {
    // Best-effort logging.
  }

  if (result.ok) {
    return {
      status: "routed",
      destination: "aggregator",
      response: { status: result.status, body: result.body },
    };
  }
  return {
    status: "failed",
    destination: "aggregator",
    response: {
      status: result.status,
      body: result.errorMessage ?? result.body,
    },
  };
}

export async function routeLead(lead: Lead): Promise<RoutingResult> {
  if (!lead.zip || !lead.service_type) {
    return { status: "no_destination", destination: "", response: null };
  }

  // 1. Contractor for ZIP + service type.
  try {
    const contractor = await getContractorForZip(lead.zip, lead.service_type);
    if (contractor) {
      const result = await tryContractor(contractor, lead);
      if (result) return result;
    }
  } catch {
    // Fall through to aggregator on lookup or post failure.
  }

  // 2. Aggregator fallback.
  const aggregatorResult = await tryAggregator(lead);
  if (aggregatorResult) return aggregatorResult;

  return { status: "no_destination", destination: "", response: null };
}

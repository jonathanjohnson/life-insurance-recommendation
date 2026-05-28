/**
 * Server-side GA4 Measurement Protocol fire. PII is never sent — only
 * categorical lead-quality dimensions. The client_id is a deterministic
 * hash of the lead UUID so GA can attribute events to the same lead
 * without exposing it.
 *
 * Fire-and-forget with a short timeout. Failures are logged and
 * swallowed so a flaky GA endpoint never blocks a lead.
 */
import crypto from "node:crypto";

const COLLECT_URL = "https://www.google-analytics.com/mp/collect";
const TIMEOUT_MS = 1_500;

export interface LeadAnalyticsParams {
  leadId: string;
  citySlug?: string | null;
  stateSlug?: string | null;
  serviceType?: string | null;
  urgency?: string | null;
  systemType?: string | null;
  partial: boolean;
}

function hashClientId(leadId: string): string {
  return crypto.createHash("sha256").update(leadId).digest("hex").slice(0, 16);
}

export async function fireLeadSubmitEvent(
  params: LeadAnalyticsParams,
): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) return;

  const payload = {
    client_id: hashClientId(params.leadId),
    non_personalized_ads: true,
    events: [
      {
        name: "lead_submit",
        params: {
          city_slug: params.citySlug ?? "",
          state_slug: params.stateSlug ?? "",
          service_type: params.serviceType ?? "",
          urgency: params.urgency ?? "",
          system_type: params.systemType ?? "",
          partial: params.partial ? 1 : 0,
        },
      },
    ],
  };

  const url = `${COLLECT_URL}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    // Best-effort. Never throw from analytics.
  } finally {
    clearTimeout(timer);
  }
}

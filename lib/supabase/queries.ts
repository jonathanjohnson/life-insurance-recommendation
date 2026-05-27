import { createServerClient } from "./client";
import type {
  ContentOverride,
  Contractor,
  Json,
  Lead,
  LeadInsert,
  LeadRoutingLogInsert,
} from "./types";

export async function insertLead(lead: LeadInsert): Promise<Lead> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("leads")
    .insert(lead)
    .select()
    .single();

  if (error) {
    throw new Error(`insertLead failed: ${error.message}`);
  }
  return data;
}

export async function updateLeadRouting(
  leadId: string,
  status: string,
  destination: string,
  response: Json,
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("leads")
    .update({
      routing_status: status,
      routing_destination: destination,
      routing_response: response,
    })
    .eq("id", leadId);

  if (error) {
    throw new Error(`updateLeadRouting failed: ${error.message}`);
  }
}

export async function getContractorForZip(
  zip: string,
  serviceType: string,
): Promise<Contractor | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("contractors")
    .select()
    .eq("status", "active")
    .contains("service_zips", [zip])
    .contains("service_types", [serviceType])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`getContractorForZip failed: ${error.message}`);
  }
  return data;
}

export async function logRoutingAttempt(
  log: LeadRoutingLogInsert,
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.from("lead_routing_log").insert(log);

  if (error) {
    throw new Error(`logRoutingAttempt failed: ${error.message}`);
  }
}

export async function getContentOverride(
  citySlug: string,
): Promise<ContentOverride | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("content_overrides")
    .select()
    .eq("city_slug", citySlug)
    .maybeSingle();

  if (error) {
    throw new Error(`getContentOverride failed: ${error.message}`);
  }
  return data;
}

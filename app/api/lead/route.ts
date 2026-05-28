import { NextResponse } from "next/server";

import { TCPA_CONSENT_TEXT } from "@/lib/forms/leadSchema";

/**
 * Lead intake endpoint — stub.
 *
 * Validates the basic shape, echoes a UUID, and 200s. Real persistence
 * (Supabase via lib/supabase/queries.ts) + lead routing + Turnstile
 * verification get wired in the next task. Keeping this minimal lets
 * the form's UX be reviewed in isolation.
 *
 * Accepts both full submissions and partial-lead saves (`partial: true`).
 */

interface MinimumLeadShape {
  zip?: unknown;
  phone?: unknown;
  email?: unknown;
  partial?: unknown;
  tcpa_consent?: unknown;
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let body: MinimumLeadShape;
  try {
    body = (await request.json()) as MinimumLeadShape;
  } catch {
    return badRequest("Invalid JSON");
  }

  const isPartial = body.partial === true;

  if (typeof body.zip !== "string" || !/^\d{5}$/.test(body.zip)) {
    return badRequest("Missing or invalid zip");
  }
  if (typeof body.phone !== "string" || body.phone.replace(/\D/g, "").length !== 10) {
    return badRequest("Missing or invalid phone");
  }

  if (!isPartial) {
    if (typeof body.email !== "string" || !body.email.includes("@")) {
      return badRequest("Missing or invalid email");
    }
    if (body.tcpa_consent !== true) {
      return badRequest("TCPA consent is required");
    }
  }

  // TODO: persist via lib/supabase/queries.insertLead, verify Turnstile
  // token server-side against TURNSTILE_SECRET_KEY, and dispatch through
  // lib/lead-routing in the follow-up task.
  void TCPA_CONSENT_TEXT;

  const id = crypto.randomUUID();
  return NextResponse.json(
    { ok: true, id, partial: isPartial },
    { status: 200 },
  );
}

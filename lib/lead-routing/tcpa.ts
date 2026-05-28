import type { NextRequest } from "next/server";

/**
 * Exact TCPA consent language displayed above the submit button on the
 * lead form. Stamped onto every lead record so we have an audit trail
 * of what the user actually saw and agreed to.
 *
 * Update this string only when legal signs off — version control is
 * the audit log.
 */
export const TCPA_CONSENT_TEXT =
  "By clicking Submit, I agree that the HVAC Pros Network and its partners may contact me at the phone number and email address provided, including via automated technology, prerecorded messages, and SMS text messages, for marketing and service-related purposes, even if my number is on a Do Not Call list. Consent is not a condition of purchase. Message and data rates may apply. I have read the Privacy Policy and Terms of Service. To opt out of texts reply STOP.";

/**
 * Extract the originating client IP from a Next.js request. Vercel sets
 * x-forwarded-for; we take the first hop. Falls back to x-real-ip then
 * the literal "unknown" so downstream callers never get null.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = "headers" in request ? request.headers : new Headers();
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

export function getUserAgent(request: NextRequest | Request): string {
  const headers = "headers" in request ? request.headers : new Headers();
  return headers.get("user-agent") ?? "unknown";
}

/**
 * Cloudflare Turnstile server-side token verification.
 *
 * Dev/preview safety: if TURNSTILE_SECRET_KEY is unset OR equals
 * Cloudflare's documented always-pass test secret, we skip the network
 * call and accept the token. In production (NODE_ENV='production') we
 * refuse to start that path — silently passing every token in prod would
 * defeat the point of Turnstile.
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TEST_SECRET = "1x0000000000000000000000000000000AA"; // always-pass
const VERIFY_TIMEOUT_MS = 2_500;

let warnedAboutMissingSecret = false;

export type TurnstileResult =
  | { ok: true; bypass: boolean }
  | { ok: false; reason: string };

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstile(
  token: string,
  remoteip: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret || secret === TEST_SECRET) {
    if (process.env.NODE_ENV === "production" && !secret) {
      return {
        ok: false,
        reason: "Turnstile secret is not configured",
      };
    }
    if (!warnedAboutMissingSecret) {
      console.warn(
        "[lead-routing] TURNSTILE_SECRET_KEY missing or set to test secret — accepting tokens without verification",
      );
      warnedAboutMissingSecret = true;
    }
    return { ok: true, bypass: true };
  }

  if (!token) return { ok: false, reason: "Missing Turnstile token" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      ...(remoteip && remoteip !== "unknown" ? { remoteip } : {}),
    });
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, reason: `siteverify HTTP ${res.status}` };
    }
    const json = (await res.json()) as SiteverifyResponse;
    if (json.success) return { ok: true, bypass: false };
    const codes = (json["error-codes"] ?? []).join(",");
    return { ok: false, reason: `siteverify rejected${codes ? `: ${codes}` : ""}` };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "siteverify request failed";
    return { ok: false, reason: message };
  } finally {
    clearTimeout(timer);
  }
}

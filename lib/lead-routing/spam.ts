/**
 * Lightweight spam heuristics. We don't reject — we flag.
 *
 * A flagged lead still lands in Supabase (we want every record for
 * tuning) but skips routing and analytics. Operators can review and
 * either route manually or mark as confirmed spam.
 */
import { validateZip } from "@/lib/data";

const DISPOSABLE_DOMAINS = new Set<string>([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "10minutemail.com",
  "yopmail.com",
  "throwawaymail.com",
  "fakeinbox.com",
  "trashmail.com",
  "sharklasers.com",
  "maildrop.cc",
  "getnada.com",
  "discard.email",
]);

const FAKE_PHONE_PATTERNS = [
  /^(\d)\1{9}$/, // all same digit (1111111111, etc.)
  /^1234567890$/,
  /^0123456789$/,
  /^9876543210$/,
];

const URL_LIKE = /(?:https?:\/\/|www\.|\.com|\.net|\.org)/i;

export interface SpamCheckInput {
  zip?: string;
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface SpamCheckResult {
  flagged: boolean;
  reasons: string[];
}

function countPunctuation(s: string): number {
  return (s.match(/[!@#$%^&*()_+={}\[\]:";'<>,.?/\\|`~]/g) ?? []).length;
}

export function isLikelySpam(input: SpamCheckInput): SpamCheckResult {
  const reasons: string[] = [];

  const phoneDigits = (input.phone ?? "").replace(/\D/g, "");
  if (phoneDigits.length === 10) {
    for (const pat of FAKE_PHONE_PATTERNS) {
      if (pat.test(phoneDigits)) {
        reasons.push("fake-phone-pattern");
        break;
      }
    }
  }

  const email = (input.email ?? "").toLowerCase();
  if (email) {
    const [local, domain] = email.split("@");
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      reasons.push("disposable-email");
    }
    if (local && local.length > 40) {
      reasons.push("email-local-too-long");
    }
  }

  const fullName = `${input.first_name ?? ""} ${input.last_name ?? ""}`.trim();
  if (URL_LIKE.test(fullName)) {
    reasons.push("name-contains-url");
  }
  if (/\d/.test(fullName)) {
    reasons.push("name-contains-digits");
  }
  if (countPunctuation(fullName) >= 3) {
    reasons.push("name-excess-punctuation");
  }

  // ZIP coverage check — fails when ZIP is well-formed but not in our
  // city dataset. validateZip already enforces 5-digit format.
  if (input.zip && /^\d{5}$/.test(input.zip) && !validateZip(input.zip)) {
    reasons.push("zip-out-of-coverage");
  }

  return { flagged: reasons.length > 0, reasons };
}

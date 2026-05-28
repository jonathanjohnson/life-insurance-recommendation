/**
 * In-memory token bucket. Best-effort: Vercel serverless invocations
 * may not share state, so this is a soft fence rather than a hard cap.
 * Swap to Vercel KV / Upstash for a globally-consistent limiter.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

function sweep(now: number) {
  // Drop entries older than two windows so memory stays bounded.
  const cutoff = now - WINDOW_MS * 2;
  for (const [k, b] of buckets) {
    if (b.windowStart < cutoff) buckets.delete(k);
  }
}

export function checkRateLimit(
  ip: string,
  now: number = Date.now(),
): RateLimitResult {
  sweep(now);
  const existing = buckets.get(ip);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= MAX_REQUESTS) {
    const elapsed = now - existing.windowStart;
    const retry = Math.ceil((WINDOW_MS - elapsed) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: retry };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Test helper. Not exported from the package boundary. */
export function _resetRateLimiterForTests() {
  buckets.clear();
}

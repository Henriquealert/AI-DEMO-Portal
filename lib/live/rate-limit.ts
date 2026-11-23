import "server-only";

/**
 * Fixed-window rate limiter.
 *
 * Uses Upstash Redis (REST) when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set, so limits hold across serverless
 * instances. Otherwise falls back to an in-memory map, which only limits
 * per instance: acceptable for local use and light traffic.
 */

const memory = new Map<string, { count: number; reset: number }>();

export type RateResult = { ok: boolean; remaining: number; retryAfter: number };

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSec);
  const bucket = `rl:${key}:${windowStart}`;
  const retryAfter = windowStart + windowSec - now;

  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", bucket],
          ["EXPIRE", bucket, String(windowSec)],
        ]),
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { result: number }[];
        const count = Number(data[0]?.result ?? 0);
        return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfter };
      }
    } catch {
      // Fall through to the in-memory limiter if Redis is unreachable.
    }
  }

  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.reset <= now) memory.delete(k);
  }
  const entry = memory.get(bucket) ?? { count: 0, reset: windowStart + windowSec };
  entry.count += 1;
  memory.set(bucket, entry);
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count), retryAfter };
}

export function clientIp(headers: Headers) {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") || "unknown";
}

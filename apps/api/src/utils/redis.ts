import { Redis } from "@upstash/redis";

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error("Missing Upstash Redis environment variables");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Single source of truth for the redirect cache key. The `:v2` suffix versions
// the value schema — bump it whenever the cached shape changes so stale entries
// from an older format are ignored instead of mis-parsed.
export const linkCacheKey = (slug: string) => `link:${slug}:v2`;

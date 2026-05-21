import { Redis } from "@upstash/redis";

// Singleton Redis client — reused across serverless invocations
// Returns null if env vars not configured (local dev fallback)

let redis: Redis | null | undefined = undefined;

export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis(): Redis | null {
  if (redis === undefined) {
    if (isRedisConfigured()) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    } else {
      redis = null;
    }
  }
  return redis;
}

// ─── Stale-While-Revalidate Cache Pattern ───

interface CacheEnvelope<T> {
  data: T;
  scrapedAt: number;
}

/** Write data to Redis with TTL */
export async function cacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const envelope: CacheEnvelope<T> = { data, scrapedAt: Date.now() };
  await r.set(key, JSON.stringify(envelope), { ex: ttlSeconds });
}

/** Read data from Redis — returns null if not found or Redis not configured */
export async function cacheGet<T>(key: string): Promise<{ data: T; scrapedAt: number } | null> {
  const r = getRedis();
  if (!r) return null;
  const raw = await r.get<string>(key);
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

// ─── Distributed Lock (for dedup) ───

export async function acquireLock(lockKey: string, ttlSeconds: number): Promise<boolean> {
  const r = getRedis();
  if (!r) return true; // always allow in local dev
  const result = await r.set(lockKey, "1", { nx: true, ex: ttlSeconds });
  return result === "OK";
}

export async function releaseLock(lockKey: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.del(lockKey);
}

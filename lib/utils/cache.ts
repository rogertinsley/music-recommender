import { redis } from "@/lib/redis";

/**
 * Read-through Redis cache helper.
 * - On cache hit: returns the cached value immediately.
 * - On cache miss: calls compute(), caches the result, and returns it.
 * - If compute() throws, the error propagates to the caller and nothing is cached.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached !== null) return JSON.parse(cached) as T;
  const value = await compute();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
  return value;
}

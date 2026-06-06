/**
 * lib/weather-cache.ts
 *
 * Server-side only. This module runs exclusively in Next.js API route handlers
 * (Node.js process) — never in the browser.
 *
 * Mental model: same as a vLLM prefix cache or any in-process KV store.
 * The singleton persists across requests within the same Node.js worker process.
 * A process restart clears the cache — this is acceptable because the cache is
 * a performance optimisation, not a source of truth.
 *
 * LRU eviction: when at capacity, the entry with the oldest `lastAccessed`
 * timestamp is removed. We track access time separately from insertion time so
 * frequently-read entries survive longer than rarely-read ones.
 */

import type { WeatherResponse, UsageResponse, WeatherQueryParams } from '@/types/weatherai';

interface CacheEntry<T> {
  data: T;
  /** Unix ms when this entry was inserted */
  insertedAt: number;
  /** Unix ms when this entry was last read — used for LRU ordering */
  lastAccessedAt: number;
  /** Absolute Unix ms when this entry expires */
  expiresAt: number;
  /** Number of cache hits for this entry (useful for debug stats) */
  hits: number;
}

class TtlLruCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;

  constructor(
    private readonly maxEntries: number,
    private readonly defaultTtlMs: number
  ) {}

  get(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      // Expired — evict eagerly rather than serving stale data
      this.store.delete(key);
      this.misses++;
      return null;
    }

    // Update access time for LRU and increment hit counters
    entry.lastAccessedAt = Date.now();
    entry.hits++;
    this.hits++;

    return entry.data;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxEntries) {
      this.evictLru();
    }

    const now = Date.now();
    this.store.set(key, {
      data: value,
      insertedAt: now,
      lastAccessedAt: now,
      expiresAt: now + (ttlMs ?? this.defaultTtlMs),
      hits: 0,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  stats(): { size: number; maxEntries: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      hitRate: total === 0 ? 0 : this.hits / total,
    };
  }

  private evictLru(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    this.store.forEach((entry, key) => {
      if (entry.lastAccessedAt < oldestAccess) {
        oldestAccess = entry.lastAccessedAt;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }
}

// ---------------------------------------------------------------------------
// Singletons
// ---------------------------------------------------------------------------

/**
 * Primary weather cache.
 * TTL: 10 minutes — weather data changes slowly and the API bills per request.
 * Capacity: 100 entries — each covers a unique lat/lon/days/lang/units combination.
 */
export const weatherCache = new TtlLruCache<WeatherResponse>(
  100,
  10 * 60 * 1000
);

/**
 * Usage/quota cache.
 * TTL: 5 minutes — quota updates in near-real-time but we don't need second-level accuracy.
 * Capacity: 1 — there is only ever one account quota per API key.
 */
export const usageCache = new TtlLruCache<UsageResponse>(1, 5 * 60 * 1000);

// ---------------------------------------------------------------------------
// Cache key builder
// ---------------------------------------------------------------------------

/**
 * Deterministic cache key for weather requests.
 * Coordinates are rounded to 4 decimal places (~11m precision) so nearby
 * GPS jitter doesn't create separate cache entries for the same farm.
 */
export function buildWeatherCacheKey(params: WeatherQueryParams): string {
  const lat = params.lat.toFixed(4);
  const lon = params.lon.toFixed(4);
  const days = params.days ?? 7;
  const lang = params.lang ?? 'en';
  const units = params.units ?? 'metric';

  return `${lat}_${lon}_${days}_${lang}_${units}`;
}

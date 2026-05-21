import { scrapeHomepage } from "./scraper";
import { getHomepageFromFirestore, saveHomepageToFirestore } from "./firebase-cache";
import type { HomepageData } from "./types";

// ─── Simple In-Memory Cache ───
// Each serverless instance gets its own cache
// TTL keeps data fresh, Firebase is permanent storage

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();

export function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function memSet<T>(key: string, data: T, ttlSeconds: number): void {
  memCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ─── Staleness Check ───
const STALE_MS = 5 * 60 * 1000; // 5 minutes — cron refreshes every 1 min, so this is a safety buffer

function isStale(scrapedAt: number): boolean {
  return Date.now() - scrapedAt > STALE_MS;
}

// ─── Get Homepage Data (on-demand, no cron needed) ───
// Flow: Memory cache → Firebase → Scrape
// If Firebase data is stale (>2 min), scrape fresh in background & update Firebase

export async function getHomepageData(): Promise<HomepageData | null> {
  // 1. In-memory cache (instant)
  const cached = memGet<HomepageData>("homepage");
  if (cached) return cached;

  // 2. Firebase
  const firebaseData = await getHomepageFromFirestore();

  if (firebaseData && !isStale(firebaseData.scrapedAt)) {
    // Fresh data — use it
    memSet("homepage", firebaseData, 30);
    return firebaseData;
  }

  // 3. Data is stale or missing — scrape fresh
  try {
    const data = await scrapeHomepage();
    const homepage: HomepageData = { ...data, scrapedAt: Date.now() };
    memSet("homepage", homepage, 30);
    // Save to Firebase (don't await to keep response fast)
    saveHomepageToFirestore(homepage).catch(() => {});
    return homepage;
  } catch {
    // Scrape failed — return stale Firebase data if available
    if (firebaseData) {
      memSet("homepage", firebaseData, 15); // shorter TTL for stale data
      return firebaseData;
    }
    return null;
  }
}

// ─── Edge Cache Headers ───

export const EDGE_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
  "CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
  "Vercel-CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
} as const;

export const CHART_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
} as const;

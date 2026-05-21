import { cacheGet, cacheSet } from "./redis";
import { scrapeHomepage } from "./scraper";
import { getHomepageFromFirestore } from "./firebase-cache";
import type { HomepageData } from "./types";
import { REDIS_KEYS, TTL } from "./types";

// ─── Get Homepage Data (3-tier fallback) ───
// 1. Redis (fastest, ~1-5ms)
// 2. Firebase (backup, ~50-100ms)
// 3. Direct scrape (last resort, ~500ms+)

export async function getHomepageData(): Promise<HomepageData | null> {
  // 1. Try Redis first
  const cached = await cacheGet<HomepageData>(REDIS_KEYS.homepage);
  if (cached) {
    return { ...cached.data, scrapedAt: cached.scrapedAt };
  }

  // 2. Try Firebase backup
  const firebaseData = await getHomepageFromFirestore();
  if (firebaseData) {
    // Warm Redis cache from Firebase so next request is fast
    await cacheSet(REDIS_KEYS.homepage, firebaseData, TTL.stale);
    return firebaseData;
  }

  // 3. Fallback: direct scrape (local dev / very first request ever)
  try {
    const data = await scrapeHomepage();
    const homepage: HomepageData = { ...data, scrapedAt: Date.now() };
    await cacheSet(REDIS_KEYS.homepage, homepage, TTL.stale);
    return homepage;
  } catch {
    return null;
  }
}

// ─── Edge Cache Headers ───

export const EDGE_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Vercel-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
} as const;

export const CHART_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
} as const;

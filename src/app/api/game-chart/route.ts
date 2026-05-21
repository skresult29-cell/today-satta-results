import { NextRequest } from "next/server";
import { cacheGet, cacheSet, acquireLock, releaseLock } from "@/lib/redis";
import { scrapeGameChart } from "@/lib/scraper";
import { REDIS_KEYS, TTL, type GameChartData } from "@/lib/types";
import { CHART_CACHE_HEADERS } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const month = searchParams.get("month") || undefined;
  const year = searchParams.get("year") || undefined;

  if (!slug) {
    return Response.json({ success: false, error: "slug is required" }, { status: 400 });
  }

  const cacheKey = REDIS_KEYS.gameChart(slug, month || "current", year || "current");

  // 1. Try Redis cache first
  const cached = await cacheGet<GameChartData>(cacheKey);
  if (cached) {
    return Response.json(
      { success: true, ...cached.data },
      { headers: CHART_CACHE_HEADERS }
    );
  }

  // 2. Cache miss — scrape with dedup lock
  const lockKey = REDIS_KEYS.lockPrefix + cacheKey;
  const locked = await acquireLock(lockKey, TTL.lock);

  if (!locked) {
    await new Promise((r) => setTimeout(r, 3000));
    const retried = await cacheGet<GameChartData>(cacheKey);
    if (retried) {
      return Response.json({ success: true, ...retried.data }, { headers: CHART_CACHE_HEADERS });
    }
    return Response.json({ success: false, error: "Data loading, try again" }, { status: 503, headers: { "Retry-After": "5" } });
  }

  try {
    const result = await scrapeGameChart(slug, month, year);
    if (!result) {
      return Response.json({ success: false, error: "Game not found" }, { status: 404 });
    }

    const chartData: GameChartData = { ...result, scrapedAt: Date.now() };
    await cacheSet(cacheKey, chartData, TTL.stale);

    return Response.json(
      { success: true, ...result },
      { headers: CHART_CACHE_HEADERS }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await releaseLock(lockKey);
  }
}

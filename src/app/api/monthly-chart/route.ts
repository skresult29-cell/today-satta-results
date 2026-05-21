import { NextRequest } from "next/server";
import { cacheGet, cacheSet, acquireLock, releaseLock } from "@/lib/redis";
import { scrapeMonthlyChart } from "@/lib/scraper";
import { getMonthlyChartFromFirestore, saveMonthlyChartToFirestore } from "@/lib/firebase-cache";
import { REDIS_KEYS, TTL, type MonthlyChartData } from "@/lib/types";
import { CHART_CACHE_HEADERS } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthName = searchParams.get("month") || "may";
  const year = searchParams.get("year") || "2026";
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();
  const cacheKey = REDIS_KEYS.monthlyChart(monthName, year);

  // 1. Try Redis
  const cached = await cacheGet<MonthlyChartData>(cacheKey);
  if (cached) {
    return Response.json(
      { success: true, month: cached.data.month, year: cached.data.year, results: cached.data.results },
      { headers: CHART_CACHE_HEADERS }
    );
  }

  // 2. Try Firebase backup
  const firebaseData = await getMonthlyChartFromFirestore(monthName, year);
  if (firebaseData) {
    // Warm Redis from Firebase
    await cacheSet(cacheKey, firebaseData, TTL.stale);
    return Response.json(
      { success: true, month: firebaseData.month, year: firebaseData.year, results: firebaseData.results },
      { headers: CHART_CACHE_HEADERS }
    );
  }

  // 3. Scrape with dedup lock
  const lockKey = REDIS_KEYS.lockPrefix + cacheKey;
  const locked = await acquireLock(lockKey, TTL.lock);

  if (!locked) {
    await new Promise((r) => setTimeout(r, 3000));
    const retried = await cacheGet<MonthlyChartData>(cacheKey);
    if (retried) {
      return Response.json(
        { success: true, month: retried.data.month, year: retried.data.year, results: retried.data.results },
        { headers: CHART_CACHE_HEADERS }
      );
    }
  }

  try {
    const results = await scrapeMonthlyChart(monthName, year);
    const chartData: MonthlyChartData = { month: formattedMonth, year, results, scrapedAt: Date.now() };

    // Store in both Redis + Firebase
    await cacheSet(cacheKey, chartData, TTL.stale);
    await saveMonthlyChartToFirestore(monthName, year, chartData);

    return Response.json(
      { success: true, month: formattedMonth, year, results },
      { headers: CHART_CACHE_HEADERS }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (locked) await releaseLock(lockKey);
  }
}

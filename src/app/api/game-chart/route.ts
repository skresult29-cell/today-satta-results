import { NextRequest } from "next/server";
import { scrapeGameChart, scrapeSK24GameChart } from "@/lib/scraper";
import { getGameChartFromFirestore, saveGameChartToFirestore } from "@/lib/firebase-cache";
import type { GameChartData } from "@/lib/types";
import { memGet, memSet, CHART_CACHE_HEADERS } from "@/lib/api-helpers";

const STALE_MS = 10 * 60 * 1000; // 10 minutes — re-scrape if older

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const month = searchParams.get("month") || undefined;
  const year = searchParams.get("year") || undefined;

  if (!slug) {
    return Response.json({ success: false, error: "slug is required" }, { status: 400 });
  }

  const cacheKey = `game:${slug}:${month || "current"}:${year || "current"}`;

  // 1. In-memory cache
  const cached = memGet<GameChartData>(cacheKey);
  if (cached) {
    return Response.json({ success: true, ...cached }, { headers: CHART_CACHE_HEADERS });
  }

  // 2. Firebase (with staleness check)
  const firebaseData = await getGameChartFromFirestore(slug, month, year);
  if (firebaseData && Date.now() - firebaseData.scrapedAt < STALE_MS) {
    memSet(cacheKey, firebaseData, 300); // 5 min
    return Response.json({ success: true, ...firebaseData }, { headers: CHART_CACHE_HEADERS });
  }

  // 3. Scrape fallback
  try {
    let result = await scrapeGameChart(slug, month, year);
    // Fallback to SK24 for games not on satta-king-fast.com
    if (!result) {
      result = await scrapeSK24GameChart(slug, month, year);
    }
    if (!result) {
      return Response.json({ success: false, error: "Game not found" }, { status: 404 });
    }

    const chartData: GameChartData = { ...result, scrapedAt: Date.now() };
    memSet(cacheKey, chartData, 300); // cache 5 min — chart data changes once/day

    // Save to Firebase in background (don't wait)
    saveGameChartToFirestore(slug, month, year, chartData).catch(() => {});

    return Response.json({ success: true, ...result }, { headers: CHART_CACHE_HEADERS });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

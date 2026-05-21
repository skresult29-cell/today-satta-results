import { NextRequest } from "next/server";
import { scrapeGameChart } from "@/lib/scraper";
import { getGameChartFromFirestore, saveGameChartToFirestore } from "@/lib/firebase-cache";
import type { GameChartData } from "@/lib/types";
import { memGet, memSet, CHART_CACHE_HEADERS } from "@/lib/api-helpers";

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

  // 2. Firebase
  const firebaseData = await getGameChartFromFirestore(slug, month, year);
  if (firebaseData) {
    memSet(cacheKey, firebaseData, 300); // 5 min — chart changes once/day
    return Response.json({ success: true, ...firebaseData }, { headers: CHART_CACHE_HEADERS });
  }

  // 3. Scrape fallback
  try {
    const result = await scrapeGameChart(slug, month, year);
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

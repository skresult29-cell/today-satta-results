import { NextRequest } from "next/server";
import { scrapeMonthlyChart } from "@/lib/scraper";
import { getMonthlyChartFromFirestore, saveMonthlyChartToFirestore } from "@/lib/firebase-cache";
import type { MonthlyChartData } from "@/lib/types";
import { memGet, memSet, CHART_CACHE_HEADERS } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthName = searchParams.get("month") || "may";
  const year = searchParams.get("year") || "2026";
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();
  const cacheKey = `chart:${monthName.toLowerCase()}:${year}`;

  // 1. In-memory cache
  const cached = memGet<MonthlyChartData>(cacheKey);
  if (cached) {
    return Response.json(
      { success: true, month: cached.month, year: cached.year, results: cached.results },
      { headers: CHART_CACHE_HEADERS }
    );
  }

  // 2. Firebase
  const firebaseData = await getMonthlyChartFromFirestore(monthName, year);
  if (firebaseData) {
    memSet(cacheKey, firebaseData, 120); // cache 2 min
    return Response.json(
      { success: true, month: firebaseData.month, year: firebaseData.year, results: firebaseData.results },
      { headers: CHART_CACHE_HEADERS }
    );
  }

  // 3. Scrape fallback (first time data)
  try {
    const results = await scrapeMonthlyChart(monthName, year);
    const chartData: MonthlyChartData = { month: formattedMonth, year, results, scrapedAt: Date.now() };

    // Save to Firebase for future reads
    await saveMonthlyChartToFirestore(monthName, year, chartData);
    memSet(cacheKey, chartData, 120);

    return Response.json(
      { success: true, month: formattedMonth, year, results },
      { headers: CHART_CACHE_HEADERS }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

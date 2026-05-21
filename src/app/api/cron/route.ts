import { NextRequest } from "next/server";
import { scrapeHomepage, scrapeMonthlyChart } from "@/lib/scraper";
import { saveHomepageToFirestore, saveMonthlyChartToFirestore } from "@/lib/firebase-cache";
import type { HomepageData, MonthlyChartData } from "@/lib/types";

// ─── Cron Job: Scrape & Save to Firebase ───
// Runs every 1 minute on the MAIN website only
// Other websites just read from Firebase — no cron needed on them
// This ensures data is always fresh and no user ever waits for a scrape

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // 1. Homepage (LIVE/NEXT/REST)
  try {
    const homepage = await scrapeHomepage();
    const data: HomepageData = { ...homepage, scrapedAt: Date.now() };
    await saveHomepageToFirestore(data);
    results.homepage = `ok (live:${homepage.live.length} next:${homepage.next.length} rest:${homepage.rest.length})`;
  } catch (err) {
    results.homepage = `failed: ${(err as Error).message}`;
  }

  // 2. Current month chart
  try {
    const now = new Date();
    const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    const month = months[now.getMonth()];
    const year = now.getFullYear().toString();
    const chart = await scrapeMonthlyChart(month, year);
    const data: MonthlyChartData = {
      month: month.charAt(0).toUpperCase() + month.slice(1),
      year,
      results: chart,
      scrapedAt: Date.now(),
    };
    await saveMonthlyChartToFirestore(month, year, data);
    results.chart = `ok (${chart.length} rows)`;
  } catch (err) {
    results.chart = `failed: ${(err as Error).message}`;
  }

  return Response.json({ status: "ok", timestamp: new Date().toISOString(), results });
}

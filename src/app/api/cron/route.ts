import { NextRequest } from "next/server";
import { cacheSet, acquireLock, releaseLock } from "@/lib/redis";
import { scrapeHomepage, scrapeMonthlyChart } from "@/lib/scraper";
import { saveHomepageToFirestore, saveMonthlyChartToFirestore } from "@/lib/firebase-cache";
import { REDIS_KEYS, TTL } from "@/lib/types";
import type { HomepageData, MonthlyChartData } from "@/lib/types";

// ─── Cron Job: Scrape & Store in Redis + Firebase ───
// Runs every 1 minute via Vercel Cron
// This is the ONLY place that hits the external source
// Flow: Scrape → Redis (fast reads) + Firebase (permanent backup)

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function withRetry<T>(fn: () => Promise<T>, retries: number = MAX_RETRIES): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`[cron] Attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }
  throw new Error("unreachable");
}

export async function GET(req: NextRequest) {
  // ─── Security: Verify cron secret ───
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lockKey = REDIS_KEYS.lockPrefix + "cron";
  const locked = await acquireLock(lockKey, TTL.lock);

  if (!locked) {
    return Response.json({ status: "skipped", reason: "another cron instance running" });
  }

  const results: Record<string, string> = {};

  try {
    // ─── 1. Scrape Homepage (LIVE/NEXT/REST) ───
    try {
      const homepage = await withRetry(() => scrapeHomepage());
      const homepageData: HomepageData = { ...homepage, scrapedAt: Date.now() };

      // Store in Redis (fast reads for API)
      await cacheSet(REDIS_KEYS.homepage, homepageData, TTL.stale);

      // Store in Firebase (permanent backup)
      await saveHomepageToFirestore(homepageData);

      results.homepage = `ok (live:${homepage.live.length} next:${homepage.next.length} rest:${homepage.rest.length})`;
    } catch (err) {
      results.homepage = `failed: ${(err as Error).message}`;
      console.error("[cron] Homepage scrape failed:", (err as Error).message);
    }

    // ─── 2. Scrape Current Month Chart ───
    try {
      const now = new Date();
      const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear().toString();
      const formattedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

      const chart = await withRetry(() => scrapeMonthlyChart(currentMonth, currentYear));
      const chartData: MonthlyChartData = {
        month: formattedMonth,
        year: currentYear,
        results: chart,
        scrapedAt: Date.now(),
      };

      // Store in Redis
      const chartKey = REDIS_KEYS.monthlyChart(currentMonth, currentYear);
      await cacheSet(chartKey, chartData, TTL.stale);

      // Store in Firebase
      await saveMonthlyChartToFirestore(currentMonth, currentYear, chartData);

      results.monthlyChart = `ok (${chart.length} rows)`;
    } catch (err) {
      results.monthlyChart = `failed: ${(err as Error).message}`;
      console.error("[cron] Monthly chart scrape failed:", (err as Error).message);
    }

    return Response.json({
      status: "completed",
      timestamp: new Date().toISOString(),
      results,
    });
  } finally {
    await releaseLock(lockKey);
  }
}

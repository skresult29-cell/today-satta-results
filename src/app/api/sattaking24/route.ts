import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { memGet, memSet, EDGE_CACHE_HEADERS } from "@/lib/api-helpers";
import { getSK24GamesFromFirestore, saveSK24GamesToFirestore } from "@/lib/firebase-cache";
import type { SK24Game, SK24GamesData, SK24Spotlight } from "@/lib/types";

const STALE_MS = 5 * 60 * 1000; // 5 minutes

async function scrapeSK24Games(): Promise<{ games: SK24Game[]; spotlight: SK24Spotlight }> {
  const { data: html } = await axios.get("https://www.satta-king-24.com/", {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const $ = cheerio.load(html);
  const games: SK24Game[] = [];

  $("#games .gboardhalf").each((_, el) => {
    const name = $(el).find(".gbgamehalf").text().trim();
    const time = $(el).find(".gbhalftime").text().replace(/[()]/g, "").trim();
    const yesterday = $(el).find(".gbhalfresulto").text().replace(/[\[\]]/g, "").trim();
    const today = $(el).find(".gbhalfresultn").text().replace(/[\[\]]/g, "").trim();

    if (name) {
      games.push({ name, time, yesterday, today });
    }
  });

  // Scrape hero spotlight (upcoming + last declared) from SK24's top section
  let upcomingName = "";
  let declaredName = "";
  let declaredResult = "";

  $(".bg-black .flex.items-center").each((_, el) => {
    const name = $(el).find(".text-white.uppercase").text().trim();
    const hasLoader = $(el).find(".loader").length > 0;
    const result = $(el).find(".text-gray-50 span").text().trim();

    if (hasLoader) {
      upcomingName = name;
    } else if (result) {
      declaredName = name;
      declaredResult = result;
    }
  });

  return { games, spotlight: { upcomingName, declaredName, declaredResult } };
}

export async function GET() {
  try {
    // 1. In-memory cache
    const cached = memGet<SK24GamesData>("sk24-games");
    if (cached) {
      return NextResponse.json(
        { success: true, games: cached.games, spotlight: cached.spotlight },
        { headers: EDGE_CACHE_HEADERS }
      );
    }

    // 2. Firebase
    const firebaseData = await getSK24GamesFromFirestore();
    if (firebaseData && Date.now() - firebaseData.scrapedAt < STALE_MS) {
      memSet("sk24-games", firebaseData, 30);
      return NextResponse.json(
        { success: true, games: firebaseData.games, spotlight: firebaseData.spotlight },
        { headers: EDGE_CACHE_HEADERS }
      );
    }

    // 3. Scrape fresh (only first user hits this)
    const { games, spotlight } = await scrapeSK24Games();
    const data: SK24GamesData = { games, spotlight, scrapedAt: Date.now() };
    memSet("sk24-games", data, 30);

    // Save to Firebase in background
    saveSK24GamesToFirestore(data).catch(() => {});

    return NextResponse.json(
      { success: true, games, spotlight },
      { headers: EDGE_CACHE_HEADERS }
    );
  } catch (err) {
    console.error("SK24 scrape error:", err);
    // Return stale Firebase data if scrape fails
    const stale = await getSK24GamesFromFirestore();
    if (stale) {
      memSet("sk24-games", stale, 15);
      return NextResponse.json(
        { success: true, games: stale.games, spotlight: stale.spotlight },
        { headers: EDGE_CACHE_HEADERS }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

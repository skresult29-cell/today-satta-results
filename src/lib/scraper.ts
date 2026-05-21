import axios from "axios";
import * as cheerio from "cheerio";
import type { GameResult, ChartRow } from "./types";

const HEADERS = { "User-Agent": "Mozilla/5.0" };
const TIMEOUT = 15_000;

// ─── Homepage Scraper ───
// Scrapes LIVE, NEXT, REST sections from satta-king-fast.com

export async function scrapeHomepage(): Promise<{
  live: GameResult[];
  next: GameResult[];
  rest: GameResult[];
}> {
  const { data } = await axios.get("https://satta-king-fast.com/", {
    headers: HEADERS,
    timeout: TIMEOUT,
  });

  const $ = cheerio.load(data);

  const live: GameResult[] = [];
  const next: GameResult[] = [];
  const rest: GameResult[] = [];

  let currentSection = "";

  $("tr").each((_i, el) => {
    const heading = $(el).find("td.games-name h3").text().trim();

    if (heading === "LIVE" || heading === "NEXT" || heading === "REST") {
      currentSection = heading;
      return;
    }

    if (
      currentSection &&
      ($(el).hasClass("game-result") || $(el).hasClass("game-result highlight"))
    ) {
      const name = $(el).find(".game-name").text().trim();
      if (!name) return;

      const game: GameResult = {
        name,
        time: $(el).find(".game-time").text().replace("at", "").trim(),
        yesterday: $(el).find(".yesterday-number h3").text().trim(),
        today: $(el).find(".today-number h3").text().trim(),
      };

      if (currentSection === "LIVE") live.push(game);
      else if (currentSection === "NEXT") next.push(game);
      else if (currentSection === "REST") rest.push(game);
    }
  });

  return { live, next, rest };
}

// ─── Monthly Chart Scraper ───

export async function scrapeMonthlyChart(month: string, year: string): Promise<ChartRow[]> {
  const monthMap: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
  };

  const monthNumber = monthMap[month.toLowerCase()];
  const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  const queryStr = `?ResultFor=${formattedMonth}-${year}&month=${monthNumber}&year=${year}`;

  const [mainRes, sgRes, dbRes] = await Promise.all([
    axios.get(`https://satta-king-fast.com/chart.php${queryStr}`, { headers: HEADERS, timeout: TIMEOUT }),
    axios.get(`https://satta-king-fast.com/shri-ganesh/satta-result-chart/sg/${queryStr}`, { headers: HEADERS, timeout: TIMEOUT }),
    axios.get(`https://satta-king-fast.com/delhi-bazar/satta-result-chart/db/${queryStr}`, { headers: HEADERS, timeout: TIMEOUT }),
  ]);

  function extractColumn(html: string, colAbbr: string): Record<string, string> {
    const $ = cheerio.load(html);
    const cols: string[] = [];
    $("th.name, th[class='name']").each((_i, el) => {
      cols.push($(el).text().trim().toUpperCase());
    });
    const colIndex = cols.indexOf(colAbbr);
    const map: Record<string, string> = {};
    $("tr.day-number").each((_i, el) => {
      const date = $(el).find("td.day").text().trim();
      if (!date) return;
      const numbers = $(el).find("td.number").map((_i, item) => $(item).text().trim()).get();
      if (numbers.length > cols.length) numbers.shift();
      map[date] = colIndex >= 0 ? (numbers[colIndex] || "XX") : "XX";
    });
    return map;
  }

  const srgnMap = extractColumn(sgRes.data, "SRGN");
  const dlbzMap = extractColumn(dbRes.data, "DLBZ");

  const $ = cheerio.load(mainRes.data);
  const results: ChartRow[] = [];

  $("table.chart-table tr.day-number").each((_i, el) => {
    const date = $(el).find("td.day").text().trim();
    let numbers = $(el).find("td.number").map((_i, item) => $(item).text().trim()).get();
    if (numbers.length > 4) numbers.shift();

    if (date) {
      results.push({
        date,
        dswr: numbers[0] || "XX",
        frbd: numbers[1] || "XX",
        gzbd: numbers[2] || "XX",
        gali: numbers[3] || "XX",
        srgn: srgnMap[date] || "XX",
        dlbz: dlbzMap[date] || "XX",
      });
    }
  });

  return results;
}

// ─── Game Chart Scraper ───

export async function scrapeGameChart(slug: string, month?: string, year?: string) {
  // Get homepage to find chart URL
  const { data: homeHtml } = await axios.get("https://satta-king-fast.com/", {
    headers: HEADERS,
    timeout: TIMEOUT,
  });

  const $home = cheerio.load(homeHtml);
  let chartUrl = "";
  $home(`a[href*="/${slug}/satta-result-chart/"]`).each((_i, el) => {
    if (!chartUrl) chartUrl = $home(el).attr("href") || "";
  });

  if (!chartUrl) return null;

  if (month && year) {
    const monthMap: Record<string, string> = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12",
    };
    const monthNum = monthMap[month.toLowerCase()];
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    chartUrl += `?month=${monthNum}&year=${year}&ResultFor=${formattedMonth}-${year}`;
  }

  const { data: chartHtml } = await axios.get(chartUrl, {
    headers: HEADERS,
    timeout: TIMEOUT,
  });

  const $ = cheerio.load(chartHtml);
  const chartTitle = $("tr.chart-head td.month h1").text().trim();

  const columns: string[] = [];
  $("tr.date-name th.name").each((_i, el) => {
    columns.push($(el).text().trim().toUpperCase());
  });

  const abbrMap: Record<string, string> = {
    DSWR: "desawar", FRBD: "faridabad", GZBD: "ghaziabad",
    GALI: "gali", SRGN: "shri-ganesh",
  };

  const gameNameUpper = slug.replace(/-/g, " ").toUpperCase();
  let gameColIndex = -1;

  columns.forEach((col, i) => {
    if (abbrMap[col] === slug) gameColIndex = i;
  });
  if (gameColIndex === -1) {
    columns.forEach((col, i) => {
      if (col === gameNameUpper) gameColIndex = i;
    });
  }
  if (gameColIndex === -1) gameColIndex = columns.length - 1;

  const results: { date: string; day: string; result: string }[] = [];

  $("tr.day-number").each((_i, el) => {
    const dayEl = $(el).find("td.day");
    const dateNum = dayEl.text().trim();
    const dateTitle = dayEl.attr("title") || "";
    const numbers = $(el).find("td.number").map((_i, item) => $(item).text().trim()).get();

    if (dateNum) {
      let dayName = "";
      if (dateTitle) {
        try {
          dayName = new Date(dateTitle).toLocaleDateString("en-US", { weekday: "long" });
        } catch { /* skip */ }
      }
      results.push({
        date: dateTitle || dateNum,
        day: dayName,
        result: gameColIndex >= 0 ? (numbers[gameColIndex] || "XX") : (numbers[numbers.length - 1] || "XX"),
      });
    }
  });

  const titleMatch = chartTitle.match(/of\s+(\w+)\s+(\d{4})/);

  return {
    gameName: gameNameUpper,
    chartTitle,
    month: titleMatch?.[1] || "",
    year: titleMatch?.[2] || "",
    columns,
    results,
  };
}

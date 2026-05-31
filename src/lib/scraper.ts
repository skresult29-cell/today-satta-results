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

// ─── SK24 Game Chart Scraper ───
// Fallback scraper for games only available on satta-king-24.com

export async function scrapeSK24GameChart(slug: string, month?: string, year?: string) {
  const { data: html } = await axios.get("https://www.satta-king-24.com/chart", {
    headers: HEADERS,
    timeout: TIMEOUT,
  });

  const $ = cheerio.load(html);
  const gameNameUpper = slug.replace(/-/g, " ").toUpperCase();

  // Find the game column across all tables
  let foundHeaders: string[] = [];
  let foundRows: string[][] = [];
  let gameColIndex = -1;
  let chartTitle = "";

  $("table.newtable").each((_, table) => {
    if (gameColIndex >= 0) return; // already found

    const headers: string[] = [];
    $(table).find("tr").eq(1).find("th").each((_, th) => {
      headers.push($(th).text().trim());
    });

    // Check if this table has our game
    const idx = headers.findIndex(
      (h) => h.toLowerCase().replace(/\s+/g, "-") === slug || h.toUpperCase() === gameNameUpper
    );

    if (idx >= 0) {
      gameColIndex = idx;
      foundHeaders = headers;
      chartTitle = $(table).find("tr").first().text().trim().replace(/\s+/g, " ");

      $(table).find("tbody tr").each((_, tr) => {
        const cells: string[] = [];
        $(tr).find("td").each((_, td) => {
          cells.push($(td).text().trim());
        });
        if (cells.length > 0) foundRows.push(cells);
      });
    }
  });

  if (gameColIndex < 0) return null;

  // Build results array (date + day + result)
  const now = new Date();
  const targetMonth = month ? month.charAt(0).toUpperCase() + month.slice(1).toLowerCase() : now.toLocaleDateString("en-US", { month: "long" });
  const targetYear = year || String(now.getFullYear());

  const results: { date: string; day: string; result: string }[] = [];

  foundRows.forEach((cells) => {
    const dateStr = cells[0] || "";
    // dateStr format is like "01-05" (dd-mm)
    const dateParts = dateStr.split("-");
    const dayNum = dateParts[0] || dateStr;
    const gameResult = cells[gameColIndex] || "XX";

    let dayName = "";
    if (dateParts.length === 2) {
      try {
        const monthNum = parseInt(dateParts[1], 10) - 1;
        const dayNumInt = parseInt(dateParts[0], 10);
        const yearInt = parseInt(targetYear, 10);
        const d = new Date(yearInt, monthNum, dayNumInt);
        dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      } catch { /* skip */ }
    }

    results.push({
      date: dayNum,
      day: dayName,
      result: gameResult || "XX",
    });
  });

  return {
    gameName: gameNameUpper,
    chartTitle,
    month: targetMonth,
    year: targetYear,
    columns: foundHeaders,
    results,
  };
}

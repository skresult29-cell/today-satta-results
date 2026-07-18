import type { ChartRow, GameResult } from "./types";

// ─── Featured Games (dedicated "<name>-result" SEO pages) ───
// The six core markets that get their own landing page with yesterday/today
// results + a full current-year chart. `chartKey` maps the game to its column
// in the monthly ChartRow scraped from satta-king-fast.com.

export interface FeaturedGame {
  name: string; // Display name, e.g. "Faridabad"
  slug: string; // URL segment, e.g. "faridabad-result"
  chartSlug: string; // Slug used by /chart/<slug> monthly chart page
  chartKey: keyof Omit<ChartRow, "date">;
  time: string; // Official declared time (IST)
  aliases: string[]; // Normalized name variants seen in scraped data
}

export const FEATURED_GAMES: FeaturedGame[] = [
  {
    name: "Faridabad",
    slug: "faridabad-result",
    chartSlug: "faridabad",
    chartKey: "frbd",
    time: "06:00 PM",
    aliases: ["faridabad", "fridabad", "faridabaad"],
  },
  {
    name: "Ghaziabad",
    slug: "ghaziabad-result",
    chartSlug: "ghaziabad",
    chartKey: "gzbd",
    time: "09:25 PM",
    aliases: ["ghaziabad", "gaziabad"],
  },
  {
    name: "Gali",
    slug: "gali-result",
    chartSlug: "gali",
    chartKey: "gali",
    time: "11:25 PM",
    aliases: ["gali"],
  },
  {
    name: "Shri Ganesh",
    slug: "shri-ganesh-result",
    chartSlug: "shri-ganesh",
    chartKey: "srgn",
    time: "04:30 PM",
    aliases: ["shriganesh", "shreeganesh", "sriganesh"],
  },
  {
    name: "Delhi Bazar",
    slug: "delhi-bazar-result",
    chartSlug: "delhi-bazar",
    chartKey: "dlbz",
    time: "03:00 PM",
    aliases: ["delhibazar", "delhibazaar"],
  },
  {
    name: "Desawar",
    slug: "desawar-result",
    chartSlug: "desawar",
    chartKey: "dswr",
    time: "05:00 AM",
    aliases: ["desawar", "disawar", "desawer", "dishawar"],
  },
];

export function getFeaturedGame(slug: string): FeaturedGame | undefined {
  return FEATURED_GAMES.find((g) => g.slug === slug.toLowerCase());
}

// Normalize a scraped game name for alias matching ("DELHI BAZAR " → "delhibazar")
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

// Find this game's row in the scraped homepage/SK24 lists (exact alias match,
// so "Gali" never matches "New Gali" / "Gali Bazar").
export function findGameResult(
  game: FeaturedGame,
  lists: GameResult[][]
): GameResult | null {
  for (const list of lists) {
    const found = list.find((g) => game.aliases.includes(normalizeName(g.name)));
    if (found) return found;
  }
  return null;
}

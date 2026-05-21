// ─── Shared Types ───

export interface GameResult {
  name: string;
  time: string;
  yesterday: string;
  today: string;
}

export interface ChartRow {
  date: string;
  dswr: string;
  frbd: string;
  gzbd: string;
  gali: string;
  srgn: string;
  dlbz: string;
}

export interface MonthlyChartData {
  month: string;
  year: string;
  results: ChartRow[];
  scrapedAt: number;
}

export interface HomepageData {
  live: GameResult[];
  next: GameResult[];
  rest: GameResult[];
  scrapedAt: number;
}

export interface GameChartData {
  gameName: string;
  chartTitle: string;
  month: string;
  year: string;
  columns: string[];
  results: { date: string; day: string; result: string }[];
  scrapedAt: number;
}

// ─── Redis Key Strategy ───
// All keys prefixed with "satta:" for namespace isolation
// Pattern: satta:{domain}:{identifier}

export const REDIS_KEYS = {
  homepage: "satta:homepage",
  monthlyChart: (month: string, year: string) => `satta:chart:${month.toLowerCase()}:${year}`,
  gameChart: (slug: string, month: string, year: string) => `satta:game:${slug}:${month}:${year}`,
  lockPrefix: "satta:lock:",
} as const;

// ─── Cache TTLs (seconds) ───

export const TTL = {
  homepage: 120,       // 2 min — cron refreshes every 1 min, 2x buffer
  monthlyChart: 600,   // 10 min — chart data changes once a day
  gameChart: 600,      // 10 min
  stale: 3600,         // 1 hour — serve stale data if scrape fails
  lock: 30,            // 30 sec — dedup lock for concurrent scrapes
} as const;

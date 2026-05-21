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

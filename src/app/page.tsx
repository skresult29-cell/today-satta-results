"use client";

import { useEffect, useState, useRef } from "react";
import { AdSlot } from "@/components/layout/AdSlot";
import Link from "next/link";
import { format } from "date-fns";
import { FiClock, FiTrendingUp, FiBarChart2, FiZap, FiPhone } from "react-icons/fi";
import { FaWhatsapp, FaTelegramPlane } from "react-icons/fa";
import { WhatsAppModal } from "@/components/layout/WhatsAppModal";

// ─── Types ───

interface GameResult {
  name: string;
  time: string;
  yesterday: string;
  today: string;
} 

interface SK24Game {
  name: string;
  time: string;
  yesterday: string;
  today: string;
}

interface SK24ChartTable {
  title: string;
  headers: string[];
  rows: string[][];
}

interface ChartRow {
  date: string;
  frbd: string;
  gzbd: string;
  gali: string;
  dswr: string;
  srgn: string;
  dlbz: string;
}

// ─── Scroll Animation ───

function useScrollAnimation(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    const el = ref.current;
    if (el) el.querySelectorAll(".sa").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

// ─── Skeleton Components ───

function TableSkeleton({ rows = 8, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="skeleton h-10 rounded-none" />
      <div className="p-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`flex gap-2 px-4 py-3 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
            <div className="skeleton h-5 w-16 shrink-0" />
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="skeleton h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-3 w-48" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="skeleton h-9 rounded-none" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
            <div className="skeleton h-5 w-28" />
            <div className="skeleton h-5 w-16 ml-auto" />
            <div className="skeleton h-5 w-12" />
            <div className="skeleton h-5 w-12" />
            <div className="skeleton h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───

export default function HomePage() {
  const [liveResults, setLiveResults] = useState<GameResult[]>([]);
  const [nextResults, setNextResults] = useState<GameResult[]>([]);
  const [restResults, setRestResults] = useState<GameResult[]>([]);
  const [chartData, setChartData] = useState<{ month: string; year: string; results: ChartRow[] }>({ month: "", year: "", results: [] });
  const [sk24Games, setSk24Games] = useState<SK24Game[]>([]);
  const [sk24Charts, setSk24Charts] = useState<SK24ChartTable[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useScrollAnimation([loading]);

  useEffect(() => {
    const now = new Date();
    const month = format(now, "MMMM").toLowerCase();
    const year = format(now, "yyyy");

    const safeFetch = (url: string) =>
      fetch(url).then((r) => r.json()).catch(() => ({ success: false, results: [] }));

    Promise.all([
      safeFetch("/api/live-results"),
      safeFetch("/api/next-results"),
      safeFetch("/api/rest-results"),
      safeFetch(`/api/monthly-chart?month=${month}&year=${year}`),
      safeFetch("/api/sattaking24"),
      safeFetch("/api/sattaking24-chart"),
    ]).then(([live, next, rest, chart, sk24, sk24chart]) => {
      if (live.success) setLiveResults(live.results || []);
      if (next.success) setNextResults(next.results || []);
      if (rest.success) setRestResults(rest.results || []);
      if (chart.success) setChartData({ month: chart.month, year: chart.year, results: chart.results || [] });
      if (sk24.success) setSk24Games(sk24.games || []);
      if (sk24chart.success) setSk24Charts(sk24chart.tables || []);
      setLoading(false);
    });
  }, []);

  const updatedAt = format(new Date(), "dd MMMM yyyy, hh:mm a") + " IST";

  // Filter out SK24 games from existing sections to avoid duplicates
  const sk24Names = new Set(sk24Games.map(g => g.name.toLowerCase().replace(/\s+/g, "")));
  const isInSK24 = (name: string) => sk24Names.has(name.toLowerCase().replace(/\s+/g, ""));
  const filteredLive = liveResults.filter(g => !isInSK24(g.name));
  const filteredNext = nextResults.filter(g => !isInSK24(g.name));
  const filteredRest = restResults.filter(g => !isInSK24(g.name));

  return (
    <div ref={containerRef}>
      <WhatsAppModal />
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white text-center py-5 md:py-8 px-3 md:px-4">
        <h1 className="text-2xl sm:text-xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2">
          Satta King {format(new Date(), "yyyy")}{" "}Live Updates: Fastest Satta Result Today &amp; Satta King Result Dashboard
        </h1>
        <div className="mt-2.5 md:mt-4 inline-flex items-center gap-1.5 md:gap-2 bg-white/5 border border-white/10 rounded-full px-3 md:px-5 py-1.5 md:py-2 text-[14px] md:text-xs text-slate-300">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-live-pulse" />
          Last Updated: {updatedAt}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-[#1e293b] border-b border-slate-700 py-1.5 md:py-2 px-2 md:px-4">
        <p className="text-center text-[12px] sm:text-[10px] md:text-xs text-slate-400 max-w-4xl mx-auto leading-relaxed">
          <span className="font-bold text-[#e63946]">DISCLAIMER:</span>{" "}
          TodaySattaResult.com is an independent informational website. We do not promote gambling or betting.{" "}
          <Link href="/disclaimer" className="text-[#d4a017] hover:underline font-medium">
            Read Full Disclaimer
          </Link>
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-2 sm:px-3 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8">
        <AdSlot placement="homepage_top" />

        {loading ? (
          <div className="space-y-8">
            <ResultTableSkeleton />
            <ResultTableSkeleton />
            <TableSkeleton rows={10} cols={6} />
          </div>
        ) : (
          <>
            {/* Satta King 24 Results */}
            {sk24Games.length > 0 && (
              <SK24ResultsSection games={sk24Games} />
            )}

            {/* Game Schedule & Contact */}
            <GameScheduleSection />

            {/* LIVE Section */}
            {filteredLive.length > 0 && (
              <GameSection
                title="LIVE Results"
                subtitle="Games currently being declared"
                icon={<FiZap size={18} />}
                accentColor="text-[#dc2626]"
                headerBg="bg-[#dc2626]"
                badgeBg="bg-red-50 text-[#dc2626]"
                games={filteredLive}
                isLive
              />
            )}

            <AdSlot placement="homepage_middle" />

            {/* Satta King 24 Charts */}
            {sk24Charts.length > 0 && (
              <SK24ChartsSection tables={sk24Charts} />
            )}

            {/* NEXT Section */}
            {filteredNext.length > 0 && (
              <GameSection
                title="Upcoming Results"
                subtitle="These games will be declared soon"
                icon={<FiClock size={18} />}
                accentColor="text-[#b45309]"
                headerBg="bg-[#d97706]"
                badgeBg="bg-amber-50 text-[#b45309]"
                games={filteredNext}
              />
            )}

            {/* REST Section */}
            {filteredRest.length > 0 && (
              <GameSection
                title="Declared Results"
                subtitle="Today's completed game results"
                icon={<FiTrendingUp size={18} />}
                accentColor="text-[#059669]"
                headerBg="bg-[#059669]"
                badgeBg="bg-emerald-50 text-[#059669]"
                games={filteredRest}
              />
            )}

            {/* Monthly Chart */}
            {chartData.results.length > 0 && (
              <MonthlyChartSection
                month={chartData.month}
                year={chartData.year}
                rows={chartData.results}
              />
            )}
          </>
        )}

        {/* Telegram Section */}
        <TelegramSection />

        {/* Welcome Content */}
        <div className="sa opacity-0 translate-y-8 bg-white rounded-xl border border-gray-200 p-4 md:p-8 space-y-3 text-xs md:text-sm text-gray-600 leading-relaxed shadow-sm">
          <p>
            Welcome to the ultimate digital hub for tracking the quickest <strong>satta result today</strong>. If you are looking for an authentic, delay-free <strong>satta king result</strong> portal, you have landed on India&apos;s most trusted platform. We understand that in this fast-paced market, even a few seconds matter. That is why our technical infrastructure is fine-tuned to deliver a <strong>satta king fast</strong> live data feed, updating winning numbers the exact moment they are officially declared.
          </p>
          <p>
            Get 100% accurate daily updates, historical charts, and guessing community insights for over 100+ national and regional markets, completely free of registration or hidden costs.
          </p>
        </div>

        {/* CTA */}
        <div className="sa opacity-0 translate-y-8 bg-[#0d1b2a] rounded-xl p-4 md:p-6 text-center border border-white/10">
          <p className="text-sm md:text-lg font-extrabold text-white">ADVERTISE YOUR GAME HERE</p>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Contact us to feature your game on TodaySattaResult.com</p>
        </div>

        <AdSlot placement="homepage_bottom" />

        {/* SEO Content */}
        <SeoContent />
      </div>
    </div>
  );
}

// ─── Game Results Table Section ───

function GameSection({
  title,
  subtitle,
  icon,
  accentColor,
  headerBg,
  badgeBg,
  games,
  isLive,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  headerBg: string;
  badgeBg: string;
  games: GameResult[];
  isLive?: boolean;
}) {
  return (
    <section className="sa opacity-0 translate-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 md:gap-3 mb-3">
        <div className={`p-2 rounded-lg ${headerBg} text-white shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl md:text-lg font-extrabold text-[#1a1a2e] flex items-center gap-2">
            {title}
            {isLive && <span className="w-2 h-2 bg-[#e63946] rounded-full animate-live-pulse" />}
          </h2>
          <p className="text-[14px] md:text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className={`ml-auto px-2.5 md:px-3 py-1 rounded-full text-[16spx] md:text-xs font-bold ${badgeBg} shrink-0`}>
          {games.length} Games
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full table-fixed">
          <thead>
            <tr className={`${headerBg} text-white text-[14px] md:text-base uppercase tracking-wider`}>
              <th className="py-2 px-1 md:px-4 text-left font-semibold w-[38%] md:w-auto">Game</th>
              <th className="py-2 px-1 md:px-3 text-center font-semibold hidden md:table-cell">Time</th>
              <th className="py-2 px-0.5 md:px-3 text-center font-semibold w-[17%] md:w-auto">Yest.</th>
              <th className="py-2 px-0.5 md:px-3 text-center font-semibold w-[17%] md:w-auto">Today</th>
              <th className="py-2 px-0.5 md:px-3 text-center font-semibold w-[13%] md:w-auto">Chart</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game, i) => {
              const slug = game.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <tr
                  key={game.name + i}
                  className={`border-t border-gray-100 transition-colors hover:bg-gray-50 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >
                  <td className="py-2 px-1 md:px-4">
                    <div className="font-extrabold text-[#1a1a2e] uppercase text-[14px]
                     md:text-lg leading-tight break-words">
                      {game.name}
                    </div>
                    <div className="text-[12px] md:hidden text-gray-400 font-medium mt-0.5">
                      {game.time}
                    </div>
                  </td>
                  <td className="py-2 px-1 md:px-3 text-center text-gray-500 text-xl font-medium hidden md:table-cell">
                    {game.time}
                  </td>
                  <td className="py-2 px-0.5 md:px-3 text-center font-mono font-bold text-gray-600 text-xl md:text-2xl">
                    {game.yesterday || "--"}
                  </td>
                  <td className={`py-2 px-0.5 md:px-3 text-center font-mono font-extrabold text-xl md:text-3xl ${accentColor}`}>
                    {game.today || (isLive ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#e63946]">
                        <span className="w-1.5 h-1.5 bg-[#e63946] rounded-full animate-live-pulse" />
                        WAIT
                      </span>
                    ) : "--")}
                  </td>
                  <td className="py-2 px-0.5 md:px-3 text-center">
                    <Link
                      href={`/chart/${slug}`}
                      className="text-[12px] md:text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Monthly Chart Section ───

function MonthlyChartSection({ month: initialMonth, year: initialYear, rows: initialRows }: { month: string; year: string; rows: ChartRow[] }) {
  const [currentDate, setCurrentDate] = useState(new Date(Number(initialYear), new Date(`${initialMonth} 1, ${initialYear}`).getMonth()));
  const [rows, setRows] = useState(initialRows);
  const [chartLoading, setChartLoading] = useState(false);

  const displayMonth = format(currentDate, "MMMM");
  const displayYear = format(currentDate, "yyyy");

  const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
  const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);

  const fetchMonth = async (date: Date) => {
    setChartLoading(true);
    const m = format(date, "MMMM").toLowerCase();
    const y = format(date, "yyyy");
    try {
      const res = await fetch(`/api/monthly-chart?month=${m}&year=${y}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.results || []);
        setCurrentDate(date);
      }
    } catch (err) {
      console.error("Chart fetch error:", err);
    } finally {
      setChartLoading(false);
    }
  };

  return (
    <div className="sa opacity-0 translate-y-8">
      <div className="flex items-center gap-2.5 md:gap-3 mb-3">
        <div className="p-2 rounded-lg bg-[#1e293b] text-white shrink-0">
          <FiBarChart2 size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl md:text-lg font-extrabold text-[#1a1a2e]">Monthly Chart {displayYear}</h2>
          <p className="text-[14px] md:text-xs text-gray-400 truncate">
            {displayMonth} {displayYear} &mdash; Gali, Desawar, Ghaziabad, Faridabad &amp; more
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-[#1e293b] text-white text-center py-2 md:py-2.5 text-[14px] md:text-sm font-bold px-2 md:px-3 leading-relaxed">
          Satta King Chart {displayMonth} {displayYear} <span className="hidden sm:inline">&mdash; Faridabad, Ghaziabad, Gali, Shri Ganesh, Delhi Bazar &amp; Desawar</span>
        </div>

        {chartLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="skeleton h-5 w-10" />
                <div className="skeleton h-5 flex-1" />
                <div className="skeleton h-5 flex-1" />
                <div className="skeleton h-5 flex-1" />
                <div className="skeleton h-5 flex-1" />
                <div className="skeleton h-5 flex-1" />
                <div className="skeleton h-5 flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed text-[18px] sm:text-xs md:text-base border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-white text-[14px] md:text-sm uppercase tracking-wider">
                  <th className="py-2 px-0.5 md:px-3 text-[#f87171] font-bold border border-gray-600">DATE</th>
                  <th className="py-2 px-0.5 md:px-3 font-semibold border border-gray-600">DLBZ</th>
                  <th className="py-2 px-0.5 md:px-3 font-semibold border border-gray-600">SRGN</th>
                  <th className="py-2 px-0.5 md:px-3 font-semibold border border-gray-600">FRBD</th>
                  <th className="py-2 px-0.5 md:px-3 font-semibold border border-gray-600">GZBD</th>
                  <th className="py-2 px-0.5 md:px-3 font-semibold border border-gray-600">GALI</th>
                  <th className="py-2 px-0.5 md:px-3 font-semibold border border-gray-600">DSWR</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.date}
                    className={`text-center transition-colors hover:bg-blue-50/50 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                    }`}
                  >
                    <td className="py-1.5 px-0.5 md:px-3 text-[#f87171] font-bold border border-gray-200">{row.date}</td>
                    <td className="py-1.5 px-0.5 md:px-3 font-mono font-bold text-gray-700 border border-gray-200">{row.dlbz}</td>
                    <td className="py-1.5 px-0.5 md:px-3 font-mono font-bold text-gray-700 border border-gray-200">{row.srgn}</td>
                    <td className="py-1.5 px-0.5 md:px-3 font-mono font-bold text-gray-700 border border-gray-200">{row.frbd}</td>
                    <td className="py-1.5 px-0.5 md:px-3 font-mono font-bold text-gray-700 border border-gray-200">{row.gzbd}</td>
                    <td className="py-1.5 px-0.5 md:px-3 font-mono font-bold text-gray-700 border border-gray-200">{row.gali}</td>
                    <td className="py-1.5 px-0.5 md:px-3 font-mono font-bold text-gray-700 border border-gray-200">{row.dswr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <button
          onClick={() => fetchMonth(prevDate)}
          disabled={chartLoading}
          className="bg-[#1e293b] text-white text-center py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-[#334155] transition-all disabled:opacity-50"
        >
          &larr; {format(prevDate, "MMM yyyy")}
        </button>
        <button
          onClick={() => fetchMonth(nextDate)}
          disabled={chartLoading}
          className="bg-[#1e293b] text-white text-center py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-[#334155] transition-all disabled:opacity-50"
        >
          {format(nextDate, "MMM yyyy")} &rarr;
        </button>
      </div>
    </div>
  );
}

// ─── Satta King 24 Results Section ───

function SK24ResultsSection({ games }: { games: SK24Game[] }) {
  return (
    <section className="sa opacity-0 translate-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 md:gap-3 mb-3">
        <div className="p-2 rounded-lg bg-[#1e40af] text-white shrink-0">
          <FiZap size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl md:text-lg font-extrabold text-[#1a1a2e] flex items-center gap-2">
            Today Satta King Result 2026
            <span className="w-2 h-2 bg-[#e63946] rounded-full animate-live-pulse" />
          </h2>
          <p className="text-[14px] md:text-xs text-gray-400">Fastest Satta King result site on internet</p>
        </div>
        <div className="ml-auto px-2.5 md:px-3 py-1 rounded-full text-[16px] md:text-xs font-bold bg-blue-50 text-[#1e40af] shrink-0">
          {games.length} Games
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-[#1e40af] text-white text-[14px] md:text-base uppercase tracking-wider">
              <th className="py-2 px-1 md:px-4 text-left font-semibold w-[38%] md:w-auto">Game</th>
              <th className="py-2 px-1 md:px-3 text-center font-semibold hidden md:table-cell">Time</th>
              <th className="py-2 px-0.5 md:px-3 text-center font-semibold w-[17%] md:w-auto">Yest.</th>
              <th className="py-2 px-0.5 md:px-3 text-center font-semibold w-[17%] md:w-auto">Today</th>
              <th className="py-2 px-0.5 md:px-3 text-center font-semibold w-[13%] md:w-auto">Chart</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game, i) => {
              const slug = game.name.toLowerCase().replace(/\s+/g, "-");
              return (
              <tr
                key={game.name + i}
                className={`border-t border-gray-100 transition-colors hover:bg-gray-50 ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                }`}
              >
                <td className="py-2 px-1 md:px-4">
                  <div className="font-extrabold text-[#1a1a2e] uppercase text-[14px] md:text-lg leading-tight break-words">
                    {game.name}
                  </div>
                  <div className="text-[12px] md:hidden text-gray-400 font-medium mt-0.5">
                    {game.time}
                  </div>
                </td>
                <td className="py-2 px-1 md:px-3 text-center text-gray-500 text-xl font-medium hidden md:table-cell">
                  {game.time}
                </td>
                <td className="py-2 px-0.5 md:px-3 text-center font-mono font-bold text-gray-600 text-xl md:text-2xl">
                  {game.yesterday || "--"}
                </td>
                <td className={`py-2 px-0.5 md:px-3 text-center font-mono font-extrabold text-xl md:text-3xl ${
                  game.today === "XX" ? "text-[#dc2626]" : "text-[#1e40af]"
                }`}>
                  {game.today || "--"}
                </td>
                <td className="py-2 px-0.5 md:px-3 text-center">
                  <Link
                    href={`/chart/${slug}`}
                    className="text-[12px] md:text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    View
                  </Link>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Satta King 24 Charts Section ───

function SK24ChartsSection({ tables }: { tables: SK24ChartTable[] }) {
  return (
    <div className="sa opacity-0 translate-y-8 space-y-6">
      {tables.map((table, idx) => (
        <div key={idx} className="bg-white rounded-xl border-2 border-black overflow-hidden shadow-sm">
          <div className="bg-[#5f9ea0] text-white text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {table.title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm md:text-base border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-white text-xs md:text-sm uppercase">
                  {table.headers.map((h, hi) => (
                    <th key={hi} className="py-2 px-1 md:px-3 font-semibold border border-black">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className={`text-center ${ri % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`py-1.5 px-1 md:px-3 font-mono font-bold border border-black ${
                          ci === 0 ? "text-[#f87171]" : "text-gray-700"
                        }`}
                      >
                        {cell || "--"}
                      </td>
                    ))}
                    {/* Fill empty cells if row is shorter than headers */}
                    {Array.from({ length: Math.max(0, table.headers.length - row.length) }).map((_, fi) => (
                      <td key={`fill-${fi}`} className="py-1.5 px-1 md:px-3 font-mono font-bold border border-black text-gray-700">
                        --
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Game Schedule & Contact Section ───

function GameScheduleSection() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "911234567890";

  const gameSchedule = [
    { name: "शिवधाम", time: "01:20 PM" },
    { name: "पुष्कर बाजार", time: "02:20 PM" },
    { name: "दिल्ली बाजार", time: "03:00 PM" },
    { name: "श्री श्याम", time: "04:10 PM" },
    { name: "श्री गणेश", time: "04:20 PM" },
    { name: "कोलंबिया", time: "05:00 PM" },
    { name: "फरीदाबाद", time: "06:00 PM" },
    { name: "मक्का मदीना", time: "07:20 PM" },
    { name: "गाज़ियाबाद", time: "09:20 PM" },
    { name: "कालका नाइट", time: "09:50 PM" },
    { name: "गली", time: "11:20 PM" },
    { name: "दिसावर", time: "03:20 AM" },
  ];

  return (
    <section className="sa opacity-0 translate-y-8">
      <div className="flex items-center gap-2.5 md:gap-3 mb-3">
        <div className="p-2 rounded-lg bg-[#d97706] text-white shrink-0">
          <FiPhone size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl md:text-lg font-extrabold text-[#1a1a2e]">
            Game Schedule & Contact
          </h2>
          <p className="text-[14px] md:text-xs text-gray-400">
            Game play करने के लिये संपर्क करे
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        {/* Header */}
        <div className="text-center py-5 px-4 bg-gradient-to-r from-[#d4a017]/20 via-[#d4a017]/10 to-[#d4a017]/20 border-b border-[#d4a017]/30">
          <p className="text-white font-bold text-base md:text-lg italic">
            बिंदास गेम प्ले कर सकते हो आप बिना किसी टेंशन के
          </p>
          <p className="text-[#d4a017] font-extrabold text-2xl md:text-3xl mt-2 tracking-wide">
            VP BHAI
          </p>
        </div>

        {/* Game Schedule List */}
        <div className="py-5 px-2 md:px-6">
          <div className="max-w-md mx-auto space-y-0">
            {gameSchedule.map((game, i) => (
              <div
                key={i}
                className={`flex items-center py-2.5 px-3 ${i % 2 === 0 ? "bg-white/[0.03]" : ""} rounded-md`}
              >
                <span className="text-[#d4a017] text-lg mr-2">&#9200;</span>
                <span className="text-white font-extrabold text-base md:text-lg">
                  {game.name}
                </span>
                <span className="flex-1 mx-2 border-b border-dotted border-slate-500" />
                <span className="text-[#d4a017] font-mono text-base md:text-lg font-bold">
                  {game.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Section */}
        <div className="border-t border-slate-600 px-4 md:px-8 py-5 text-center space-y-3 bg-white/[0.02]">
          <p className="text-[#d4a017] font-extrabold text-lg md:text-xl">
            Payment Option
          </p>
          <p className="text-slate-300 text-sm md:text-base font-semibold tracking-wide">
            PAYTM // BANK TRANSFER // PHONE PAY // GOOGLE PAY
          </p>
          <p className="text-slate-400 text-sm">
            =&gt; <span className="text-white font-bold">{phone}</span>
          </p>
        </div>

        {/* Phone Number Highlight */}
        <div className="px-4 py-4 text-center">
          <div className="max-w-sm mx-auto border-t-2 border-b-2 border-[#d4a017] py-3">
            <a
              href={`tel:+${phone.replace(/[^0-9]/g, "")}`}
              className="text-[#d4a017] font-extrabold text-2xl md:text-3xl tracking-widest hover:text-[#e8b82a] transition-colors"
            >
              {phone}
            </a>
          </div>
        </div>

        {/* Rate List */}
        <div className="border-t border-slate-600 px-4 md:px-8 py-5 text-center space-y-4 bg-white/[0.02]">
          <p className="text-[#d4a017] font-extrabold text-lg md:text-xl">
            Rate List
          </p>
          <div className="max-w-sm mx-auto grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-[#d4a017]/15 to-[#d4a017]/5 border border-[#d4a017]/30 rounded-xl px-4 py-3 text-center">
              <p className="text-white font-extrabold text-base">जोड़ी रेट</p>
              <p className="text-[#d4a017] font-extrabold text-xl mt-1">10 — 960</p>
            </div>
            <div className="bg-gradient-to-br from-[#d4a017]/15 to-[#d4a017]/5 border border-[#d4a017]/30 rounded-xl px-4 py-3 text-center">
              <p className="text-white font-extrabold text-base">हरूफ रेट</p>
              <p className="text-[#d4a017] font-extrabold text-xl mt-1">100 — 960</p>
            </div>
          </div>
        </div>

        {/* Contact Name */}
        <div className="px-4 py-4 text-center">
          <p className="text-[#d4a017] font-extrabold text-2xl tracking-wide">VP BHAI</p>
        </div>

        {/* WhatsApp CTA */}
        <div className="border-t border-slate-600 px-4 py-5 text-center space-y-4 bg-gradient-to-t from-[#25D366]/10 to-transparent">
          <p className="text-white font-bold text-base md:text-lg">
            Game play करने के लिये नीचे लिंक पर क्लिक करे
          </p>
          <a
            href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("VP BHAI")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1fb855] text-white font-extrabold text-lg md:text-xl px-8 py-3.5 rounded-full shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:shadow-green-400/40 hover:shadow-xl"
          >
            <FaWhatsapp className="w-7 h-7 md:w-8 md:h-8" />
            <div className="text-left">
              <div className="text-lg md:text-xl font-extrabold leading-tight">WhatsApp</div>
              <div className="text-xs font-semibold opacity-90">Click to chat</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Telegram Section ───

function TelegramSection() {
  return (
    <div className="sa opacity-0 translate-y-8 bg-gradient-to-b from-[#0f172a] to-[#1e293b] rounded-xl border border-slate-700 p-5 md:p-8 text-center space-y-4 shadow-lg">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0088cc]/20 mb-1">
        <FaTelegramPlane className="w-7 h-7 text-[#0088cc]" />
      </div>
      <h3 className="text-white font-extrabold text-lg md:text-xl">
        Satta King Daily Passing Tricks
      </h3>
      <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
        Delhi Bazar se Disawar tak daily passing pane ke liye hamare Telegram channel ko join karein.
      </p>
      <a
        href="https://t.me/kingfast24"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-extrabold text-base md:text-lg px-6 py-3 rounded-full shadow-lg shadow-[#0088cc]/20 transition-all hover:scale-105 hover:shadow-[#0088cc]/40 hover:shadow-xl"
      >
        <FaTelegramPlane className="w-5 h-5" />
        Join Telegram Channel
      </a>
      <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg mx-auto">
        Channel join karke website ko bookmark kar lo, taaki aapko rozana 2-3 game passing aur latest updates milti rahein.
      </p>
    </div>
  );
}

// ─── SEO Content ───

function SeoContent() {
  return (
    <div className="sa opacity-0 translate-y-8 bg-white rounded-xl border border-gray-200 p-4 md:p-8 space-y-4 md:space-y-5 text-xs md:text-sm text-gray-600 leading-relaxed shadow-sm">
      <h2 className="text-xl md:text-2xl font-extrabold text-[#0d1b2a]">Understanding Satta King &amp; The Traditional Satta Matka Result Ecosystem</h2>
      <p>
        The world of <strong>satta king</strong> historically operates as a highly engaging, number-based lottery where participants select numerical combinations based on structural analysis and mathematical guessing. While the mainstream <strong>satta king {new Date().getFullYear()}</strong> market focuses on specific localized draws, millions of daily enthusiasts also follow the broader <strong>satta matka result</strong> frameworks that run across different states.
      </p>
      <p>
        Because multiple independent operators manage these draws, finding a single, verified <strong>matka result</strong> online can often be confusing. Our platform bridges this communication gap by acting as a verified aggregator, bringing you clean, direct, and real-time updates from every corner of the country.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Why Bookmark TodaySattaResult.com for Live Updates?</h2>
      <ul className="list-none space-y-2 pl-0">
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>Unmatched Speed:</strong> Our automated scraping system guarantees a <strong>satta king fast</strong> experience, bypassing the usual server lags found on older platforms.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>Massive Regional Coverage:</strong> From premium national games to local <strong>sattaking up</strong> and popular <strong>up sattaking</strong> circles, we leave no market uncovered.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>Deep Trend Analysis Archives:</strong> Access comprehensive, well-organized historical data sheets from 2015 up to the current <strong>satta king {new Date().getFullYear()}</strong> timeline to track recurring numerical patterns.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>Responsive Mobile Interface:</strong> Over 95% of users check results via smartphones. Our UI/UX is built specifically as a mobile-first application so that tables never overlap.</span>
        </li>
      </ul>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Live Satta King Gali Disawar &amp; National Game Time Table</h2>
      <p>
        Timing is everything. To make sure you never miss a draw, here is the official daily timetable for India&apos;s core markets. Our platform updates the <strong>satta king gali disawar</strong> panels simultaneously during these peak schedules:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-[#0f172a] text-white">
              <th className="py-2 px-3 text-left font-semibold">Game Name</th>
              <th className="py-2 px-3 text-left font-semibold">Official Draw Time</th>
              <th className="py-2 px-3 text-left font-semibold">Update Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100 bg-white">
              <td className="py-2 px-3 font-bold text-[#1a1a2e]">Desawar Satta</td>
              <td className="py-2 px-3">05:00 AM</td>
              <td className="py-2 px-3 text-emerald-600 font-medium">Early Morning Live Update</td>
            </tr>
            <tr className="border-t border-gray-100 bg-gray-50/40">
              <td className="py-2 px-3 font-bold text-[#1a1a2e]">Delhi Bazar</td>
              <td className="py-2 px-3">03:00 PM</td>
              <td className="py-2 px-3 text-emerald-600 font-medium">Afternoon Live Update</td>
            </tr>
            <tr className="border-t border-gray-100 bg-white">
              <td className="py-2 px-3 font-bold text-[#1a1a2e]">Shri Ganesh</td>
              <td className="py-2 px-3">04:30 PM</td>
              <td className="py-2 px-3 text-emerald-600 font-medium">Evening Live Update</td>
            </tr>
            <tr className="border-t border-gray-100 bg-gray-50/40">
              <td className="py-2 px-3 font-bold text-[#1a1a2e]">Faridabad Satta</td>
              <td className="py-2 px-3">06:00 PM</td>
              <td className="py-2 px-3 text-emerald-600 font-medium">Late Evening Live Update</td>
            </tr>
            <tr className="border-t border-gray-100 bg-white">
              <td className="py-2 px-3 font-bold text-[#1a1a2e]">Ghaziabad Satta</td>
              <td className="py-2 px-3">09:25 PM</td>
              <td className="py-2 px-3 text-emerald-600 font-medium">Prime Night Live Update</td>
            </tr>
            <tr className="border-t border-gray-100 bg-gray-50/40">
              <td className="py-2 px-3 font-bold text-[#1a1a2e]">Gali Satta</td>
              <td className="py-2 px-3">11:25 PM</td>
              <td className="py-2 px-3 text-emerald-600 font-medium">Midnight Live Update</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 italic">
        <strong>Note:</strong> We also provide rapid result displays for specialized regional markets like Mohali, Meerut City, Super Taj, Jaipur King, Mumbai Bazaar, Agra Special, Rajdhani Day, Kashipur, and Aligarh Gold as soon as the respective operators drop the numbers.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">How to Navigate and Track Results Safely</h2>
      <p>
        Checking your daily numbers on our platform is incredibly straightforward:
      </p>
      <ul className="list-none space-y-2 pl-0">
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#8226;</span>
          <span><strong>The Live Stream:</strong> When you open the homepage, the ongoing, flashing <strong>satta result today</strong> dashboard will appear right at the top.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#8226;</span>
          <span><strong>Yesterday vs Today Comparison:</strong> The interactive layout places yesterday&apos;s final numbers right next to today&apos;s declared digits for quick verification.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#8226;</span>
          <span><strong>Deep Archives:</strong> If you want to analyze long-term patterns, simply click on the &quot;View Chart&quot; button next to any game to look at the multi-year history sheet.</span>
        </li>
      </ul>

      <h3 className="text-lg font-bold text-[#0d1b2a]">Disclaimer &amp; Platform Usage Policy</h3>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700">
        <strong>Important Legal Notice:</strong> This platform, TodaySattaResult.com, is strictly meant for informational, educational, and historical archival purposes only. We do not own, operate, or facilitate any form of online gambling, lottery, betting, or Satta Matka operations. Participation in these activities may be illegal, restricted, or completely banned under the jurisdiction of your local state laws. We strongly advise all visitors to comply with their respective regional regulations. This website does not encourage or endorse any illegal monetary transactions.
      </div>
      {/* Spacer for fixed WhatsApp button */}
      <div className="h-20" />
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { AdSlot } from "@/components/layout/AdSlot";
import Link from "next/link";
import { format } from "date-fns";
import { FiClock, FiTrendingUp, FiBarChart2, FiZap } from "react-icons/fi";

// ─── Types ───

interface GameResult {
  name: string;
  time: string;
  yesterday: string;
  today: string;
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
    ]).then(([live, next, rest, chart]) => {
      if (live.success) setLiveResults(live.results || []);
      if (next.success) setNextResults(next.results || []);
      if (rest.success) setRestResults(rest.results || []);
      if (chart.success) setChartData({ month: chart.month, year: chart.year, results: chart.results || [] });
      setLoading(false);
    });
  }, []);

  const updatedAt = format(new Date(), "dd MMMM yyyy, hh:mm a") + " IST";

  return (
    <div ref={containerRef}>
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white text-center py-6 md:py-8 px-4">
        <h1 className="text-xl md:text-4xl font-extrabold tracking-tight mb-1.5 md:mb-2">
          Today Satta King Result {format(new Date(), "yyyy")}
        </h1>
        <p className="text-xs md:text-base text-slate-400 leading-relaxed max-w-3xl mx-auto">
          Superfast Live Satta Result of {format(new Date(), "do MMMM yyyy")} for
          Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh, Delhi Bazar &amp; 100+ Games
        </p>
        <div className="mt-3 md:mt-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 md:px-5 py-1.5 md:py-2 text-[10px] md:text-xs text-slate-300">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-live-pulse" />
          Last Updated: {updatedAt}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-[#1e293b] border-b border-slate-700 py-2 px-3 md:px-4">
        <p className="text-center text-[10px] md:text-xs text-slate-400 max-w-4xl mx-auto">
          <span className="font-bold text-[#e63946]">DISCLAIMER:</span>{" "}
          TodaySattaResult.com is an independent informational website. We do not promote gambling or betting.{" "}
          <Link href="/disclaimer" className="text-[#d4a017] hover:underline font-medium">
            Read Full Disclaimer
          </Link>
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-6 space-y-8">
        <AdSlot placement="homepage_top" />

        {loading ? (
          <div className="space-y-8">
            <ResultTableSkeleton />
            <ResultTableSkeleton />
            <TableSkeleton rows={10} cols={6} />
          </div>
        ) : (
          <>
            {/* LIVE Section */}
            {liveResults.length > 0 && (
              <GameSection
                title="LIVE Results"
                subtitle="Games currently being declared"
                icon={<FiZap size={18} />}
                accentColor="text-[#dc2626]"
                headerBg="bg-[#dc2626]"
                badgeBg="bg-red-50 text-[#dc2626]"
                games={liveResults}
                isLive
              />
            )}

            <AdSlot placement="homepage_middle" />

            {/* Monthly Chart */}
            {chartData.results.length > 0 && (
              <MonthlyChartSection month={chartData.month} year={chartData.year} rows={chartData.results} />
            )}

            {/* NEXT Section */}
            {nextResults.length > 0 && (
              <GameSection
                title="Upcoming Results"
                subtitle="These games will be declared soon"
                icon={<FiClock size={18} />}
                accentColor="text-[#b45309]"
                headerBg="bg-[#d97706]"
                badgeBg="bg-amber-50 text-[#b45309]"
                games={nextResults}
              />
            )}

            {/* REST Section */}
            {restResults.length > 0 && (
              <GameSection
                title="Declared Results"
                subtitle="Today's completed game results"
                icon={<FiTrendingUp size={18} />}
                accentColor="text-[#059669]"
                headerBg="bg-[#059669]"
                badgeBg="bg-emerald-50 text-[#059669]"
                games={restResults}
              />
            )}
          </>
        )}

        {/* CTA */}
        <div className="sa opacity-0 translate-y-8 bg-[#0d1b2a] rounded-xl p-6 text-center border border-white/10">
          <p className="text-lg font-extrabold text-white">ADVERTISE YOUR GAME HERE</p>
          <p className="text-sm text-gray-400 mt-1">Contact us to feature your game on TodaySattaResult.com</p>
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
          <h2 className="text-base md:text-lg font-extrabold text-[#1a1a2e] flex items-center gap-2">
            {title}
            {isLive && <span className="w-2 h-2 bg-[#e63946] rounded-full animate-live-pulse" />}
          </h2>
          <p className="text-[10px] md:text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className={`ml-auto px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${badgeBg} shrink-0`}>
          {games.length} Games
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className={`${headerBg} text-white text-sm md:text-base uppercase tracking-wider`}>
              <th className="py-3 px-3 md:px-4 text-left font-semibold">Game Name</th>
              <th className="py-3 px-2 md:px-3 text-center font-semibold hidden md:table-cell">Time</th>
              <th className="py-3 px-2 md:px-3 text-center font-semibold">Yesterday</th>
              <th className="py-3 px-2 md:px-3 text-center font-semibold">Today</th>
              <th className="py-3 px-2 md:px-3 text-center font-semibold">Chart</th>
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
                  <td className="py-3.5 px-3 md:px-4">
                    <div className="font-extrabold text-[#1a1a2e] uppercase text-base md:text-lg leading-tight">
                      {game.name}
                    </div>
                    <div className="text-xs md:hidden text-gray-400 font-medium mt-0.5">
                      {game.time}
                    </div>
                  </td>
                  <td className="py-3.5 px-2 md:px-3 text-center text-gray-500 text-sm font-medium hidden md:table-cell">
                    {game.time}
                  </td>
                  <td className="py-3.5 px-2 md:px-3 text-center font-mono font-bold text-gray-600 text-lg md:text-xl">
                    {game.yesterday || "--"}
                  </td>
                  <td className={`py-3.5 px-2 md:px-3 text-center font-mono font-extrabold text-xl md:text-2xl ${accentColor}`}>
                    {game.today || (isLive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#e63946]">
                        <span className="w-1.5 h-1.5 bg-[#e63946] rounded-full animate-live-pulse" />
                        WAIT
                      </span>
                    ) : "--")}
                  </td>
                  <td className="py-3.5 px-2 md:px-3 text-center">
                    <Link
                      href={`/chart/${slug}`}
                      className="text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors"
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
          <h2 className="text-base md:text-lg font-extrabold text-[#1a1a2e]">Monthly Chart {displayYear}</h2>
          <p className="text-[10px] md:text-xs text-gray-400 truncate">
            {displayMonth} {displayYear} &mdash; Gali, Desawar, Ghaziabad, Faridabad &amp; more
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-[#1e293b] text-white text-center py-2.5 text-xs md:text-sm font-bold px-3">
          Satta King Result Chart of {displayMonth} {displayYear} &mdash; Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh &amp; Delhi Bazar
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="bg-[#0f172a] text-white text-xs md:text-sm uppercase tracking-wider">
                  <th className="py-2.5 px-2 md:px-3 text-[#f87171] font-bold">DATE</th>
                  <th className="py-2.5 px-2 md:px-3 font-semibold">DSWR</th>
                  <th className="py-2.5 px-2 md:px-3 font-semibold">FRBD</th>
                  <th className="py-2.5 px-2 md:px-3 text-[#fbbf24] font-semibold">GZBD</th>
                  <th className="py-2.5 px-2 md:px-3 font-semibold">GALI</th>
                  <th className="py-2.5 px-2 md:px-3 text-[#a78bfa] font-semibold">SRGN</th>
                  <th className="py-2.5 px-2 md:px-3 text-[#60a5fa] font-semibold">DLBZ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.date}
                    className={`border-t border-gray-100 text-center transition-colors hover:bg-blue-50/50 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                    }`}
                  >
                    <td className="py-2.5 px-2 md:px-3 text-[#f87171] font-bold">{row.date}</td>
                    <td className="py-2.5 px-2 md:px-3 font-mono font-bold text-gray-700">{row.dswr}</td>
                    <td className="py-2.5 px-2 md:px-3 font-mono font-bold text-gray-700">{row.frbd}</td>
                    <td className="py-2.5 px-2 md:px-3 font-mono font-bold text-[#d97706]">{row.gzbd}</td>
                    <td className="py-2.5 px-2 md:px-3 font-mono font-bold text-gray-700">{row.gali}</td>
                    <td className="py-2.5 px-2 md:px-3 font-mono font-bold text-purple-500">{row.srgn}</td>
                    <td className="py-2.5 px-2 md:px-3 font-mono font-bold text-blue-500">{row.dlbz}</td>
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

// ─── SEO Content ───

function SeoContent() {
  return (
    <div className="sa opacity-0 translate-y-8 bg-white rounded-xl border border-gray-200 p-6 md:p-8 space-y-5 text-sm text-gray-600 leading-relaxed shadow-sm">
      <h2 className="text-xl font-extrabold text-[#0d1b2a]">
        Today Satta Result &mdash; Live Satta King Result {new Date().getFullYear()}
      </h2>
      <p>
        Welcome to <strong>TodaySattaResult.com</strong>, India&apos;s number one destination for superfast live
        <strong> Satta King results</strong>. We provide the fastest and most accurate daily results for all major games
        including <strong>Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh, Delhi Bazar</strong> and over
        <strong> 100+ regional Satta King games</strong>. Whether you are looking for today&apos;s live result,
        yesterday&apos;s result, or complete monthly Satta King chart records from 2015 to 2026, you will find
        everything right here &mdash; updated every minute, completely free.
      </p>

      <h3 className="text-lg font-bold text-[#0d1b2a]">What is Satta King?</h3>
      <p>
        <strong>Satta King</strong> is one of the most popular number-based games in India. Players choose a number
        and wait for the official result to be declared at a fixed time. There are hundreds of Satta King games
        played across India daily, with the most popular being <strong>Gali Satta King</strong>,
        <strong> Desawar Satta King</strong>, <strong>Ghaziabad Satta King</strong>, and
        <strong> Faridabad Satta King</strong>. Results are declared by authorized operators at specific times
        throughout the day and night. Our website collects these results instantly and displays them for
        informational purposes.
      </p>

      <h3 className="text-lg font-bold text-[#0d1b2a]">Why Choose TodaySattaResult.com?</h3>
      <ul className="list-none space-y-2 pl-0">
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>Superfast Results:</strong> We update Satta King results within seconds of official declaration &mdash; faster than any other website</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>100+ Games Covered:</strong> Complete coverage of Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh, Delhi Bazar, Mohali, Meerut City, Super Taj, Jaipur King, Mumbai Bazaar, and many more</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>Monthly Chart Records:</strong> Free Satta King chart records for all major games from 2015 to {new Date().getFullYear()}, updated daily</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>Mobile Optimized:</strong> Fully responsive design that works perfectly on mobile, tablet, and desktop</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>100% Free:</strong> All results, charts, and notifications are completely free &mdash; no registration required</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] font-bold mt-0.5">&#10003;</span>
          <span><strong>WhatsApp Notifications:</strong> Get instant Satta King result alerts directly on WhatsApp</span>
        </li>
      </ul>

      <h3 className="text-lg font-bold text-[#0d1b2a]">Satta King Result Time Table {new Date().getFullYear()}</h3>
      <p>
        The four most popular <strong>Satta King games</strong> and their official result times are:
        <strong> Desawar</strong> (05:00 AM), <strong>Faridabad</strong> (06:00 PM),
        <strong> Ghaziabad</strong> (09:25 PM), and <strong>Gali</strong> (11:25 PM). Other popular games include
        <strong> Shri Ganesh</strong> (04:30 PM), <strong>Delhi Bazar</strong> (03:00 PM),
        <strong> Mohali</strong>, <strong>Meerut City</strong>, <strong>Super Taj</strong>,
        <strong> Jaipur King</strong>, <strong>Mumbai Bazaar</strong>, <strong>Agra Special</strong>,
        <strong> Rajdhani Day</strong>, <strong>Kashipur</strong>, <strong>Aligarh Gold</strong>,
        and many more. All results are available on TodaySattaResult.com as soon as they are declared.
      </p>

      <h3 className="text-lg font-bold text-[#0d1b2a]">Monthly Satta King Chart {new Date().getFullYear()}</h3>
      <p>
        View complete <strong>monthly Satta King result charts</strong> for Gali, Desawar, Ghaziabad, Faridabad,
        Shri Ganesh, and Delhi Bazar. Our chart records are available from <strong>2015 to {new Date().getFullYear()}</strong> and
        are updated daily with the latest results. Use the monthly chart to track patterns, view historical
        data, and access past results for any date. Charts for all 100+ games are also available on our
        dedicated chart pages.
      </p>

      <h3 className="text-lg font-bold text-[#0d1b2a]">How to Check Today Satta King Result?</h3>
      <p>
        Checking today&apos;s Satta King result on TodaySattaResult.com is simple. Visit our homepage and you will
        see all live results at the top, followed by upcoming games and declared results. Each game shows
        yesterday&apos;s result and today&apos;s result side by side. You can also click &quot;View Chart&quot; next to any game
        to see its complete monthly history. Bookmark <strong>TodaySattaResult.com</strong> for the fastest updates every day.
      </p>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700">
        <strong>Disclaimer:</strong> TodaySattaResult.com is purely an informational website. We do not
        encourage, promote, or endorse any form of gambling, betting, or illegal activity. Users must comply
        with all applicable local, state, and national laws. This website is intended for informational
        purposes only. Please gamble responsibly.
      </div>
    </div>
  );
}

import { AdSlot } from "@/components/layout/AdSlot";
import Link from "next/link";
import { format } from "date-fns";
import { FiClock, FiTrendingUp, FiZap, FiPhone } from "react-icons/fi";
import { FaWhatsapp, FaTelegramPlane } from "react-icons/fa";
import { WhatsAppModal } from "@/components/layout/WhatsAppModal";
import { MonthlyChartSection } from "@/components/home/MonthlyChartSection";
import { ScrollAnimator } from "@/components/home/ScrollAnimator";
import { getHomepageData, getSK24Data, getMonthlyChart } from "@/lib/api-helpers";
import { FEATURED_GAMES } from "@/lib/featured-games";
import { isTodayResultDeclared } from "@/lib/utils";
import type { GameResult, SK24Game } from "@/lib/types";

// Server-render the page and revalidate at most once every 30s. The HTML
// (results + charts) is cached at the edge, so a traffic spike triggers at most
// one regeneration per window — no per-request scraping, no client fetch waterfall.
export const revalidate = 60;

// ─── Main Page (Server Component) ───

export default async function HomePage() {
  const now = new Date();
  const month = format(now, "MMMM").toLowerCase();
  const year = format(now, "yyyy");

  // Fetch everything on the server, directly from the data layer (no self-HTTP).
  const [homepage, sk24, chart] = await Promise.all([
    getHomepageData(),
    getSK24Data(),
    getMonthlyChart(month, year),
  ]);

  const liveResults = homepage?.live ?? [];
  const nextResults = homepage?.next ?? [];
  const restResults = homepage?.rest ?? [];
  const sk24Games = sk24?.games ?? [];
  const spotlight = sk24?.spotlight ?? null;
  const chartData = chart
    ? { month: chart.month, year: chart.year, results: chart.results }
    : { month: "", year: "", results: [] };

  const updatedAt = format(now, "dd MMMM yyyy, hh:mm a") + " IST";

  // Filter out SK24 games from existing sections to avoid duplicates
  const sk24Names = new Set(sk24Games.map((g) => g.name.toLowerCase().replace(/\s+/g, "")));
  const isInSK24 = (name: string) => sk24Names.has(name.toLowerCase().replace(/\s+/g, ""));
  const filteredLive = liveResults.filter((g) => !isInSK24(g.name));
  const filteredNext = nextResults.filter((g) => !isInSK24(g.name));
  // const filteredRest = restResults.filter((g) => !isInSK24(g.name));
  const filteredRest = restResults.filter(
    (g) =>
      !isInSK24(g.name) &&
      !g.name.toLowerCase().includes("show your game here")
  );
  return (
    <ScrollAnimator>
      <WhatsAppModal />

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white text-center py-5 md:py-8 px-3 md:px-4">
        <h1 className="text-2xl sm:text-xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2">
          Today Satta Result {year} - Live Gali, Desawar, Faridabad &amp; Ghaziabad Results
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

      {/* Featured Game Result Pages */}
      <FeaturedGamesBox year={year} />

      <div className="max-w-[1400px] mx-auto px-2 sm:px-3 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8">
        <AdSlot placement="homepage_top" />

        {/* Live Spotlight — next upcoming + last declared */}
        {spotlight && <LiveSpotlight spotlight={spotlight} />}

        {/* Satta King 24 Results */}
        {sk24Games.length > 0 && <SK24ResultsSection games={sk24Games} />}

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

        {/* Telegram Section */}
        <TelegramSection />

        {/* CTA */}
        <div className="sa opacity-0 translate-y-8 bg-[#0d1b2a] rounded-xl p-4 md:p-6 text-center border border-white/10">
          <p className="text-sm md:text-lg font-extrabold text-white">ADVERTISE YOUR GAME HERE</p>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Contact us to feature your game on TodaySattaResult.com</p>
        </div>

        <AdSlot placement="homepage_bottom" />

        {/* SEO Content */}
        <SeoContent />
      </div>
    </ScrollAnimator>
  );
}

// ─── Featured Games Box — quick links to dedicated result pages ───

function FeaturedGamesBox({ year }: { year: string }) {
  return (
    <div className="bg-[#111c2e] border-b border-slate-700 py-4 md:py-5 px-3 md:px-4">
      <div className="max-w-4xl mx-auto bg-[#0a0f1a] rounded-xl border-2 border-slate-700 p-3.5 md:p-5 shadow-lg">
        <p className="text-center text-sm md:text-base font-extrabold text-white uppercase tracking-wide mb-3">
          Satta King Result {year} <span className="text-[#d4a017]">&mdash;</span> Direct Result Pages
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
          {FEATURED_GAMES.map((game) => (
            <Link
              key={game.slug}
              href={`/${game.slug}`}
              className="block text-center bg-gradient-to-b from-[#1e293b] to-[#0f172a] hover:from-[#d4a017] hover:to-[#b45309] border border-slate-600 hover:border-[#d4a017] rounded-lg py-2.5 md:py-3 px-2 transition-all hover:scale-[1.03]"
            >
              <span className="block text-white font-extrabold text-[13px] md:text-sm uppercase leading-tight">
                {game.name} Result {year}
              </span>
              <span className="block text-[10px] md:text-[11px] text-slate-400 mt-0.5 font-medium">
                {game.time} &bull; Today &amp; Chart
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Live Spotlight — upcoming + last declared (scraped from SK24 hero) ───

function LiveSpotlight({ spotlight }: { spotlight: { upcomingName: string; declaredName: string; declaredResult: string } }) {
  if (!spotlight.upcomingName && !spotlight.declaredName) return null;

  return (
    <div className="bg-[#0a0f1a] rounded-xl border-2 border-slate-700 overflow-hidden shadow-lg">
      {/* Date/Time Header */}
      <div className="bg-white py-1.5 px-3 text-center">
        <p className="text-xs md:text-sm font-bold text-[#0f172a] font-mono">
          {format(new Date(), "MMMM d, yyyy h:mm:ss a")}
        </p>
      </div>

      {/* Horizontal layout — upcoming + declared */}
      <div className="flex items-center justify-center divide-x divide-slate-700">
        {/* Upcoming */}
        {spotlight.upcomingName && (
          <div className="flex flex-col items-center py-4 md:py-5 px-4 md:px-8 flex-1 animate-fade-pulse">
            <p className="text-sm md:text-lg font-extrabold text-white uppercase text-center tracking-wide leading-tight">
              {spotlight.upcomingName}
            </p>
            <FiClock className="mt-2 w-8 h-8 md:w-10 md:h-10 text-slate-400" />
          </div>
        )}

        {/* Declared */}
        {spotlight.declaredName && (
          <div className="flex flex-col items-center py-4 md:py-5 px-4 md:px-8 flex-1">
            <p className="text-sm md:text-lg font-extrabold text-white uppercase text-center tracking-wide leading-tight">
              {spotlight.declaredName}
            </p>
            <p className="text-3xl md:text-4xl font-extrabold text-slate-300 font-mono mt-1.5">
              {spotlight.declaredResult}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Game Results Table Section ───

function GameSection({
  title,
  subtitle,
  headerBg,
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
  // Map headerBg class to a hex color for the title bar
  const titleBarColor = headerBg.includes("dc2626") ? "#dc2626"
    : headerBg.includes("d97706") ? "#d97706"
    : headerBg.includes("059669") ? "#059669"
    : "#5f9ea0";

  return (
    <section className="">
      <div className="bg-white rounded-xl border-2 border-black overflow-hidden shadow-sm">
        {/* Title Bar */}
        <div
          className="text-white text-center py-2.5 px-3 text-sm md:text-base font-bold uppercase tracking-wide"
          style={{ backgroundColor: titleBarColor }}
        >
          {title} {isLive && <span className="inline-block w-2 h-2 bg-white rounded-full animate-live-pulse ml-1" />}
          <span className="block text-[11px] md:text-xs font-normal normal-case tracking-normal opacity-80">{subtitle}</span>
        </div>

        {/* Column Headers */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm md:text-base border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-white text-xs md:text-sm uppercase">
                <th className="py-2 px-1 md:px-3 font-semibold border border-black text-left w-[46%] md:w-auto">GAME</th>
                <th className="py-2 px-1 md:px-3 font-semibold border border-black text-center hidden md:table-cell">TIME</th>
                <th className="py-2 px-1 md:px-3 font-semibold border border-black text-center w-[27%] md:w-auto">YEST.</th>
                <th className="py-2 px-1 md:px-3 font-semibold border border-black text-center w-[27%] md:w-auto">TODAY</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game, i) => {
                const slug = game.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <tr
                    key={game.name + i}
                    className={`text-center ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="py-2 px-1.5 md:px-3 text-left border border-black">
                      <div className="leading-tight break-words font-extrabold text-[#1a1a2e] uppercase text-[17px] md:text-2xl">{game.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] md:hidden text-gray-400 font-medium">{game.time}</span>
                        <Link
                          href={`/chart/${slug}`}
                          className="text-[12px] md:text-sm font-bold text-blue-500 hover:text-blue-700"
                        >
                          View Chart &rarr;
                        </Link>
                      </div>
                    </td>
                    <td className="py-1.5 px-1 md:px-3 font-mono font-bold text-gray-500 border border-black hidden md:table-cell">
                      {game.time}
                    </td>
                    <td className="py-1.5 px-1 md:px-3 font-mono text-[20px] sm:text-xs md:text-base font-bold text-gray-700 border border-black">
                      {game.yesterday || "--"}
                    </td>
                    <td className="py-1.5 px-1 md:px-3 font-mono text-[20px] sm:text-xs md:text-base font-extrabold border border-black text-[#1e40af]">
                      {game.today || (isLive ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#e63946]">
                          <span className="w-1.5 h-1.5 bg-[#e63946] rounded-full animate-live-pulse" />
                          WAIT
                        </span>
                      ) : "--")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Satta King 24 Results Section ───

function SK24ResultsSection({ games }: { games: SK24Game[] }) {
  return (
    <section className="">
      <div className="bg-white rounded-xl border-2 border-black overflow-hidden shadow-sm">
        {/* Title Bar */}
        <div className="bg-[#1e40af] text-white text-center py-2.5 px-3 text-sm md:text-base font-bold uppercase tracking-wide">
          Today Satta King Result 2026 <span className="inline-block w-2 h-2 bg-white rounded-full animate-live-pulse ml-1" />
          <span className="block text-[11px] md:text-xs font-normal normal-case tracking-normal opacity-80">
            Fastest Satta King result site on internet &mdash; {games.length} Games
          </span>
        </div>

        {/* Column Headers */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm md:text-base border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-white text-xs md:text-sm uppercase">
                <th className="py-2 px-1 md:px-3 font-semibold border border-black text-left w-[46%] md:w-auto">GAME</th>
                <th className="py-2 px-1 md:px-3 font-semibold border border-black text-center hidden md:table-cell">TIME</th>
                <th className="py-2 px-1 md:px-3 font-semibold border border-black text-center w-[27%] md:w-auto">YEST.</th>
                <th className="py-2 px-1 md:px-3 font-semibold border border-black text-center w-[27%] md:w-auto">TODAY</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game, i) => {
                const slug = game.name.toLowerCase().replace(/\s+/g, "-");
                // The scraped `today` value lingers from the previous day after
                // midnight. Only trust it once this game's declared time has
                // actually passed in IST — otherwise it's not out yet.
                const declared = isTodayResultDeclared(game.time);
                return (
                  <tr
                    key={game.name + i}
                    className={`text-center ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="py-2 px-1.5 md:px-3 text-left border border-black">
                      <div className="leading-tight break-words font-extrabold text-[#1a1a2e] uppercase text-[17px] md:text-2xl">{game.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] md:hidden text-gray-400 font-medium">{game.time}</span>
                        <Link
                          href={`/chart/${slug}`}
                          className="text-[12px] md:text-sm font-bold text-blue-500 hover:text-blue-700"
                        >
                          View Chart &rarr;
                        </Link>
                      </div>
                    </td>
                    <td className="py-1.5 px-1 md:px-3 font-mono  font-bold text-gray-500 border border-black hidden md:table-cell">
                      {game.time}
                    </td>
                    <td className="py-1.5 px-1 md:px-3 text-[20px] sm:text-xs md:text-base font-mono font-bold text-gray-700 border border-black">
                      {game.yesterday || "--"}
                    </td>
                    <td className={`py-1.5 px-1 md:px-3 text-[20px] sm:text-xs md:text-base font-mono font-extrabold border border-black ${
                      declared && game.today && game.today !== "XX" ? "text-[#1e40af]" : "text-[#dc2626]"
                    }`}>
                      {declared && game.today && game.today !== "XX" ? game.today : "XX"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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
    <section className="">
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

      {/* Yellow contact card with red dashed border */}
      <div className="rounded-2xl border-2 border-dashed border-[#e63946] bg-gradient-to-b from-[#FFD93B] via-[#FCE684] to-[#FEF9E7] px-4 md:px-10 py-6 md:py-9 text-center shadow-lg">
        {/* Header */}
        <p className="text-[#1a1a2e] font-extrabold text-base md:text-2xl tracking-tight">
          &#11088; Direct Company No.1 Khaiwal &#11088;
        </p>
        <p className="text-[#1a1a2e] font-extrabold text-3xl md:text-5xl mt-1.5 md:mt-2 tracking-tight">
          VP BHAI
        </p>

        {/* Game Schedule List — cream inner card */}
        <div className="max-w-xl mx-auto mt-5 md:mt-7 bg-[#FFFBEA] rounded-2xl border border-[#EBD98A] shadow-sm px-4 md:px-7 py-3 md:py-4 text-left">
          {gameSchedule.map((game, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 py-2.5 md:py-3 ${
                i !== gameSchedule.length - 1 ? "border-b border-dashed border-[#E0CF8A]" : ""
              }`}
            >
              <span className="text-lg md:text-xl">&#9200;</span>
              <span className="text-[#1a1a2e] font-bold text-base md:text-xl">
                {game.name}
              </span>
              <span className="flex-1" />
              <span className="text-[#1a1a2e] font-extrabold text-base md:text-xl tracking-wide">
                {game.time}
              </span>
            </div>
          ))}
        </div>

        {/* Rate cards */}
        <div className="max-w-md mx-auto mt-6 md:mt-8 grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white rounded-xl border-2 border-[#E0B43A] px-4 py-3 shadow-sm">
            <p className="text-gray-500 font-bold text-[11px] md:text-xs uppercase tracking-widest">Jodi Rate</p>
            <p className="text-[#1e40af] font-extrabold text-2xl md:text-3xl mt-0.5">10-960</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-[#E0B43A] px-4 py-3 shadow-sm">
            <p className="text-gray-500 font-bold text-[11px] md:text-xs uppercase tracking-widest">Haruf Rate</p>
            <p className="text-[#1e40af] font-extrabold text-2xl md:text-3xl mt-0.5">100-960</p>
          </div>
        </div>

        {/* Payment options */}
        <p className="text-[#1a1a2e] font-extrabold text-sm md:text-lg uppercase tracking-wide mt-6 md:mt-8">
          PAYTM &bull; PHONEPE &bull; GOOGLE PAY &bull; BANK TRANSFER
        </p>
        <p className="text-[#e63946] font-bold text-xs md:text-sm mt-1.5">
          PhonePe, GooglePay &amp; Paytm Scanner Available
        </p>

        {/* Phone number */}
        <a
          href={`tel:+${phone.replace(/[^0-9]/g, "")}`}
          className="block text-[#1e40af] font-extrabold text-3xl md:text-5xl tracking-tight underline underline-offset-4 decoration-2 mt-5 md:mt-7 hover:text-[#1d4ed8] transition-colors break-all"
        >
          +{phone.replace(/[^0-9]/g, "")}
        </a>

        {/* Contact name */}
        <p className="text-[#1a1a2e] font-extrabold text-2xl md:text-3xl mt-5 md:mt-7">
          &#128522;&#128522; VP BHAI &#128522;&#128522;
        </p>
        <p className="text-[#1a1a2e] font-bold text-sm md:text-lg mt-2">
          Game play karne ke liye niche link par click kare
        </p>

        {/* WhatsApp CTA */}
        <a
          href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("VP BHAI")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1fb855] text-white font-extrabold text-lg md:text-xl px-8 py-3.5 rounded-full shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:shadow-green-400/40 hover:shadow-xl mt-6 md:mt-8"
        >
          <FaWhatsapp className="w-7 h-7 md:w-8 md:h-8" />
          <div className="text-left">
            <div className="text-lg md:text-xl font-extrabold leading-tight">WhatsApp</div>
            <div className="text-xs font-semibold opacity-90">Click To Chat</div>
          </div>
        </a>
      </div>
    </section>
  );
}

// ─── Telegram Section ───

function TelegramSection() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "911234567890";
  const waLink = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("VP BHAI")}`;

  return (
    <div className="sa opacity-0 translate-y-8 bg-gradient-to-b from-[#0f172a] to-[#1e293b] rounded-xl border border-slate-700 p-5 md:p-8 text-center space-y-4 shadow-lg">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0088cc]/20 mb-1">
        <FaTelegramPlane className="w-7 h-7 text-[#0088cc]" />
      </div>
      <h3 className="text-white font-extrabold text-lg md:text-xl">
        Satta King Daily Passing Tricks
      </h3>
      <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
        Delhi Bazar se Disawar tak daily passing pane ke liye hamare WhatsApp par contact karein.
      </p>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-extrabold text-base md:text-lg px-6 py-3 rounded-full shadow-lg shadow-[#0088cc]/20 transition-all hover:scale-105 hover:shadow-[#0088cc]/40 hover:shadow-xl"
      >
        <FaTelegramPlane className="w-5 h-5" />
        Join Telegram Channel
      </a>
      <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg mx-auto">
        Website ko bookmark kar lo, taaki aapko rozana 2-3 game passing aur latest updates milti rahein.
      </p>
    </div>
  );
}

// ─── SEO Content ───

function SeoContent() {
  const year = new Date().getFullYear();
  return (
    <div className="sa opacity-0 translate-y-8 bg-white rounded-xl border border-gray-200 p-4 md:p-8 space-y-4 md:space-y-5 text-xs md:text-sm text-gray-600 leading-relaxed shadow-sm">
      <h2 className="text-xl md:text-2xl font-extrabold text-[#0d1b2a]">Today Satta Result {year}</h2>
      <p>
        Welcome to Today Satta Result, where you can check the latest Satta King results updated every day. We provide fast and accurate results for popular markets including Gali, Desawar, Faridabad and Ghaziabad. Our goal is to make it easy for visitors to find today&apos;s results, previous records and daily updates in one place.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Live Satta King Result</h2>
      <p>
        Our website updates the latest Satta King results throughout the day. Whether you are looking for Gali Result, Desawar Result, Faridabad Result or Ghaziabad Result, you can check all available market results quickly.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Gali Result Today</h2>
      <p>
        Gali is one of the most searched Satta markets. We publish the latest Gali Result along with previous records so users can easily review earlier outcomes.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Desawar Result Today</h2>
      <p>
        Find the latest Desawar Result with daily updates. Historical results are also available to help visitors check previous records.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Faridabad Result Today</h2>
      <p>
        Today&apos;s Faridabad Result is updated regularly after the official market declaration. Previous charts and old results are also available.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Ghaziabad Result Today</h2>
      <p>
        Check the latest Ghaziabad Result along with daily updates and historical records in a simple and easy-to-read format.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Satta King Chart</h2>
      <p>
        Our website also provides Satta King charts for different markets. Here is the daily timetable for the core markets, and you can view old records and previous results for reference using the chart links beside each game.
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

      <h2 className="text-xl font-bold text-[#0d1b2a]">Why Choose Today Satta Result?</h2>
      <ul className="list-none space-y-2 pl-0">
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Fast daily result updates</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Mobile-friendly website</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Easy navigation</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Daily market records</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Historical charts</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Simple and clean design</span>
        </li>
      </ul>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Frequently Asked Questions</h2>
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-[#0d1b2a]">What is Today Satta Result?</h3>
          <p>
            Today Satta Result shows the latest daily results for popular Satta King markets including Gali, Desawar, Faridabad and Ghaziabad.
          </p>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0d1b2a]">How often are results updated?</h3>
          <p>
            Results are updated as soon as the respective market declares them.
          </p>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0d1b2a]">Can I check old Satta results?</h3>
          <p>
            Yes. Previous results and charts are available for different markets.
          </p>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0d1b2a]">Is this website mobile friendly?</h3>
          <p>
            Yes. The website is designed to work smoothly on mobile, tablet and desktop devices.
          </p>
        </div>
      </div>

      <h3 className="text-lg font-bold text-[#0d1b2a]">Disclaimer</h3>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700">
        This website is provided for informational purposes only. We do not own, operate, or facilitate any form of online gambling, lottery, betting, or Satta Matka operations. Participation in these activities may be illegal or restricted under your local state laws. Visitors should use the information responsibly and comply with the laws applicable in their location.
      </div>
      {/* Spacer for fixed WhatsApp button */}
      <div className="h-20" />
    </div>
  );
}

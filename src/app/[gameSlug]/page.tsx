import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, subDays } from "date-fns";
import { FiClock, FiTrendingUp } from "react-icons/fi";
import { AdSlot } from "@/components/layout/AdSlot";
import { getHomepageData, getSK24Data, getMonthlyChart } from "@/lib/api-helpers";
import { FEATURED_GAMES, getFeaturedGame, findGameResult, type FeaturedGame } from "@/lib/featured-games";
import { isTodayResultDeclared } from "@/lib/utils";

// Same edge-cached server-render strategy as the homepage: one regeneration
// per window at most, no per-request scraping.
export const revalidate = 60;

const BASE_URL = "https://www.todaysattaresults.com";

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export function generateStaticParams() {
  return FEATURED_GAMES.map((g) => ({ gameSlug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}): Promise<Metadata> {
  const { gameSlug } = await params;
  const game = getFeaturedGame(gameSlug);
  if (!game) return {};

  const year = new Date().getFullYear();
  const title = `${game.name} Satta King Result ${year} — Today & Yesterday Live Result Chart`;
  const description = `Check ${game.name} Satta King result ${year} live. Today ${game.name} result declared at ${game.time}, yesterday result, and complete ${game.name} yearly record chart ${year} updated daily.`;

  return {
    title,
    description,
    keywords: [
      `${game.name} result ${year}`,
      `${game.name} satta result`,
      `${game.name} satta king`,
      `${game.name} result today`,
      `${game.name} chart ${year}`,
      "satta king result",
    ],
    alternates: { canonical: `${BASE_URL}/${game.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${game.slug}`,
      type: "website",
    },
  };
}

export default async function GameResultPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const { gameSlug } = await params;
  const game = getFeaturedGame(gameSlug);
  if (!game) notFound();

  const now = new Date();
  const year = String(now.getFullYear());
  const months = MONTH_NAMES.slice(0, now.getMonth() + 1);

  const [homepage, sk24, monthlyCharts] = await Promise.all([
    getHomepageData(),
    getSK24Data(),
    Promise.all(months.map((m) => getMonthlyChart(m, year).catch(() => null))),
  ]);

  // Today / yesterday numbers — SK24 list first (freshest), then homepage lists.
  const found = findGameResult(game, [
    sk24?.games ?? [],
    homepage?.live ?? [],
    homepage?.next ?? [],
    homepage?.rest ?? [],
  ]);

  const declared = isTodayResultDeclared(game.time);
  const todayResult =
    declared && found?.today && found.today !== "XX" ? found.today : null;
  const yesterdayResult =
    found?.yesterday && found.yesterday !== "XX" ? found.yesterday : null;

  // Yearly chart: day-of-month rows × month columns, from the cached monthly charts.
  const monthColumns = months.map((m, i) => {
    const chart = monthlyCharts[i];
    const dayMap: Record<number, string> = {};
    for (const row of chart?.results ?? []) {
      const dayNum = parseInt(row.date, 10);
      if (!isNaN(dayNum)) dayMap[dayNum] = row[game.chartKey];
    }
    return { label: m.charAt(0).toUpperCase() + m.slice(1, 3), dayMap };
  });
  const hasYearData = monthColumns.some((c) => Object.keys(c.dayMap).length > 0);

  const todayLabel = format(now, "dd MMMM yyyy");
  const yesterdayLabel = format(subDays(now, 1), "dd MMMM yyyy");

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white text-center py-5 md:py-8 px-3 md:px-4">
        <h1 className="text-2xl sm:text-xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 uppercase">
          {game.name} Satta King Result {year}
        </h1>
        <p className="text-slate-300 text-xs md:text-sm max-w-2xl mx-auto">
          Live {game.name} result today &amp; yesterday with complete {year} record chart
        </p>
        <div className="mt-2.5 md:mt-4 inline-flex items-center gap-1.5 md:gap-2 bg-white/5 border border-white/10 rounded-full px-3 md:px-5 py-1.5 md:py-2 text-[14px] md:text-xs text-slate-300">
          <FiClock className="w-3.5 h-3.5" />
          Result Time: {game.time} IST
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-2 sm:px-3 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8">
        <AdSlot placement="homepage_top" />

        {/* Yesterday / Today result cards */}
        <section className="bg-[#0a0f1a] rounded-xl border-2 border-slate-700 overflow-hidden shadow-lg">
          <div className="bg-white py-1.5 px-3 text-center">
            <p className="text-xs md:text-sm font-bold text-[#0f172a] font-mono">
              {game.name.toUpperCase()} &mdash; {todayLabel}
            </p>
          </div>
          <div className="flex items-stretch justify-center divide-x divide-slate-700">
            <div className="flex flex-col items-center justify-center py-5 md:py-7 px-4 md:px-8 flex-1">
              <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wide">
                Yesterday Result
              </p>
              <p className="text-[11px] text-slate-500 mb-1.5">{yesterdayLabel}</p>
              <p className="text-4xl md:text-5xl font-extrabold text-slate-300 font-mono">
                {yesterdayResult || "--"}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center py-5 md:py-7 px-4 md:px-8 flex-1">
              <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wide">
                Today Result
              </p>
              <p className="text-[11px] text-slate-500 mb-1.5">{todayLabel}</p>
              {todayResult ? (
                <p className="text-4xl md:text-5xl font-extrabold text-emerald-400 font-mono">
                  {todayResult}
                </p>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-xl md:text-2xl font-extrabold text-[#e63946] mt-2">
                  <span className="w-2.5 h-2.5 bg-[#e63946] rounded-full animate-live-pulse" />
                  WAIT
                </p>
              )}
            </div>
          </div>
          <div className="bg-[#111c2e] text-center py-2 px-3 border-t border-slate-700">
            <Link
              href={`/chart/${game.chartSlug}`}
              className="text-[12px] md:text-sm font-bold text-blue-400 hover:text-blue-300"
            >
              View {game.name} Monthly Chart &rarr;
            </Link>
          </div>
        </section>

        {/* Current-year chart */}
        <section className="bg-white rounded-xl border-2 border-black overflow-hidden shadow-sm">
          <div className="bg-[#1e40af] text-white text-center py-2.5 px-3 text-sm md:text-base font-bold uppercase tracking-wide">
            <span className="inline-flex items-center gap-1.5">
              <FiTrendingUp size={16} /> {game.name} Result Chart {year}
            </span>
            <span className="block text-[11px] md:text-xs font-normal normal-case tracking-normal opacity-80">
              Complete day-wise {game.name} record from January {year} till today
            </span>
          </div>
          {hasYearData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0f172a] text-white uppercase">
                    <th className="py-2 px-2 md:px-3 font-semibold border border-black text-left">Date</th>
                    {monthColumns.map((c) => (
                      <th key={c.label} className="py-2 px-2 md:px-3 font-semibold border border-black text-center">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <tr key={day} className={`text-center ${day % 2 === 1 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="py-1.5 px-2 md:px-3 font-bold text-[#e63946] border border-black text-left">
                        {String(day).padStart(2, "0")}
                      </td>
                      {monthColumns.map((c) => {
                        const val = c.dayMap[day];
                        return (
                          <td
                            key={c.label}
                            className={`py-1.5 px-2 md:px-3 font-mono font-bold border border-black ${
                              val && val !== "XX" ? "text-[#1e40af]" : "text-gray-300"
                            }`}
                          >
                            {val && val !== "XX" ? val : "--"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {game.name} chart data for {year} is being updated. Please check back shortly.
            </div>
          )}
        </section>

        <AdSlot placement="homepage_middle" />

        {/* SEO Content */}
        <SeoContent game={game} year={year} />

        <AdSlot placement="homepage_bottom" />

        <div className="text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm font-medium">
            &larr; Back to All Satta King Results
          </Link>
        </div>
      </div>

      {/* FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(game, year)) }}
      />
    </>
  );
}

// ─── SEO Content ───

function SeoContent({ game, year }: { game: FeaturedGame; year: string }) {
  const otherGames = FEATURED_GAMES.filter((g) => g.slug !== game.slug);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-8 space-y-4 md:space-y-5 text-xs md:text-sm text-gray-600 leading-relaxed shadow-sm">
      <h2 className="text-xl md:text-2xl font-extrabold text-[#0d1b2a]">
        {game.name} Satta King Result {year} &mdash; Today &amp; Yesterday
      </h2>
      <p>
        Welcome to the official {game.name} result page of Today Satta Result. Here you can check
        the latest {game.name} Satta King result for {year}, updated daily right after the market
        declares its number at {game.time} IST. Along with today&apos;s and yesterday&apos;s {game.name} result,
        this page also shows the complete {game.name} record chart for {year}, so you can review
        every result of the year in one place without searching anywhere else.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">{game.name} Result Time &mdash; {game.time}</h2>
      <p>
        The {game.name} Satta result is declared once every day at {game.time} IST. Until the number
        is officially out, this page shows a &quot;WAIT&quot; status for today&apos;s result. As soon as the
        {" "}{game.name} market announces its number, our system updates it here within minutes, making
        this one of the fastest sources to check the {game.name} result online.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">{game.name} Chart {year} &mdash; Old Records</h2>
      <p>
        The yearly chart above lists every {game.name} result from January {year} up to today in a
        simple date-wise format. Old records are useful for visitors who want to review previous
        outcomes of the {game.name} market month by month. For a detailed month-by-month view with
        day names, you can also open the{" "}
        <Link href={`/chart/${game.chartSlug}`} className="text-blue-600 hover:underline font-medium">
          {game.name} monthly chart
        </Link>
        , where records of earlier years are available as well.
      </p>

      <h2 className="text-xl font-bold text-[#0d1b2a]">How to Check {game.name} Result Today?</h2>
      <ul className="list-none space-y-2 pl-0">
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Open this page any time after {game.time} IST &mdash; today&apos;s {game.name} number appears in the green box above.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Yesterday&apos;s {game.name} result is always shown beside today&apos;s result for quick comparison.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Scroll down to the {year} chart to check any older {game.name} result of the year.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#e63946] mt-0.5">&#10003;</span>
          <span>Bookmark this page to get the {game.name} result daily without searching again.</span>
        </li>
      </ul>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Other Satta King Results {year}</h2>
      <p>
        Along with {game.name}, you can also check daily results and yearly charts of all other
        popular Satta King markets:
      </p>
      <div className="flex flex-wrap gap-2">
        {otherGames.map((g) => (
          <Link
            key={g.slug}
            href={`/${g.slug}`}
            className="inline-block bg-gray-100 hover:bg-blue-50 text-[#0d1b2a] hover:text-blue-700 font-bold text-xs md:text-sm px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
          >
            {g.name} Result {year}
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-bold text-[#0d1b2a]">Frequently Asked Questions</h2>
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-[#0d1b2a]">
            What time is the {game.name} result declared?
          </h3>
          <p>
            The {game.name} Satta King result is declared daily at {game.time} IST and is updated on
            this page within minutes of the declaration.
          </p>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0d1b2a]">
            Where can I check the {game.name} result of {year}?
          </h3>
          <p>
            This page shows the complete {game.name} result chart for {year}, listing every declared
            number date-wise from January till today.
          </p>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0d1b2a]">
            Can I see yesterday&apos;s {game.name} result here?
          </h3>
          <p>
            Yes. Yesterday&apos;s {game.name} result is always displayed at the top of this page next to
            today&apos;s result.
          </p>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0d1b2a]">
            Are old {game.name} records available?
          </h3>
          <p>
            Yes. The yearly chart on this page covers all of {year}, and the {game.name} monthly
            chart page lets you browse records of previous months and years.
          </p>
        </div>
      </div>

      <h3 className="text-lg font-bold text-[#0d1b2a]">Disclaimer</h3>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700">
        This website is provided for informational purposes only. We do not own, operate, or
        facilitate any form of online gambling, lottery, betting, or Satta Matka operations.
        Participation in these activities may be illegal or restricted under your local state laws.
        Visitors should use the information responsibly and comply with the laws applicable in
        their location.
      </div>
      {/* Spacer for fixed WhatsApp button */}
      <div className="h-20" />
    </div>
  );
}

// ─── FAQ Structured Data ───

function buildFaqSchema(game: FeaturedGame, year: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What time is the ${game.name} result declared?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The ${game.name} Satta King result is declared daily at ${game.time} IST and is updated on this page within minutes of the declaration.`,
        },
      },
      {
        "@type": "Question",
        name: `Where can I check the ${game.name} result of ${year}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `This page shows the complete ${game.name} result chart for ${year}, listing every declared number date-wise from January till today.`,
        },
      },
      {
        "@type": "Question",
        name: `Can I see yesterday's ${game.name} result here?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. Yesterday's ${game.name} result is always displayed at the top of the page next to today's result.`,
        },
      },
    ],
  };
}

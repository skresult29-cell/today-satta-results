"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface ChartRow {
  date: string;
  day: string;
  result: string;
}

export default function GameChartPage({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}) {
  const { gameCode } = use(params);
  const gameName = gameCode.replace(/-/g, " ").toUpperCase();

  const [rows, setRows] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayMonth, setDisplayMonth] = useState("");
  const [displayYear, setDisplayYear] = useState("");
  const [resultTime, setResultTime] = useState("");

  // Track current month/year for navigation
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth()));

  const fetchChart = async (date: Date) => {
    setLoading(true);
    const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    const m = monthNames[date.getMonth()];
    const y = String(date.getFullYear());

    try {
      const res = await fetch(`/api/game-chart?slug=${gameCode}&month=${m}&year=${y}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.results || []);
        setDisplayMonth(data.month || m.charAt(0).toUpperCase() + m.slice(1));
        setDisplayYear(data.year || y);
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChart(currentDate);
  }, [gameCode, currentDate]);

  // Get result time from the homepage data (find in live/next/rest)
  useEffect(() => {
    const findTime = async () => {
      try {
        const endpoints = ["/api/live-results", "/api/next-results", "/api/rest-results"];
        for (const url of endpoints) {
          const res = await fetch(url);
          const data = await res.json();
          if (data.success) {
            const found = data.results?.find(
              (g: { name: string }) => g.name.toLowerCase().replace(/\s+/g, "-") === gameCode
            );
            if (found) {
              setResultTime(found.time);
              return;
            }
          }
        }
      } catch { /* ignore */ }
    };
    findTime();
  }, [gameCode]);

  const navigateMonth = (dir: -1 | 1) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + dir);
    setCurrentDate(newDate);
  };

  const isCurrentMonth =
    currentDate.getFullYear() === now.getFullYear() &&
    currentDate.getMonth() === now.getMonth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-[#1e293b] text-center mb-1">
        {gameName} Chart Record
      </h1>
      <p className="text-center text-gray-500 text-sm mb-6">
        Monthly result history for {gameName}
      </p>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <FiChevronLeft size={20} />
        </button>
        <div className="text-lg font-bold text-[#1e293b] min-w-[200px] text-center">
          {displayMonth || "..."} {displayYear}
        </div>
        <button
          onClick={() => navigateMonth(1)}
          disabled={isCurrentMonth}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiChevronRight size={20} />
        </button>
      </div>

      {/* Chart Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading chart...</div>
        ) : rows.length > 0 ? (
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="bg-[#1e293b] text-white">
                <th className="py-2.5 px-2 md:px-4 text-left font-semibold">Date</th>
                <th className="py-2.5 px-2 md:px-4 text-left font-semibold">Day</th>
                <th className="py-2.5 px-2 md:px-4 text-center font-semibold">{gameName} Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.date + i}
                  className={`border-t border-gray-100 transition-colors hover:bg-blue-50 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="py-3 px-3 md:px-4 font-bold text-gray-800">{row.date}</td>
                  <td className="py-3 px-3 md:px-4">
                    <div className="font-bold text-gray-800">{row.day}</div>
                    {resultTime && (
                      <div className="text-xs font-semibold text-gray-400 mt-0.5">{resultTime}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 md:px-4 text-center">
                    <span className={`inline-block min-w-[44px] py-1.5 px-4 rounded-lg font-extrabold font-mono text-lg ${
                      row.result === "XX" || !row.result
                        ? "text-gray-400"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {row.result || "XX"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No chart data available for {displayMonth} {displayYear}.
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          &larr; Back to All Charts
        </Link>
      </div>
    </div>
  );
}

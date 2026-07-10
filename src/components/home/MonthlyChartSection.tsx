"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FiBarChart2 } from "react-icons/fi";
import type { ChartRow } from "@/lib/types";

export function MonthlyChartSection({
  month: initialMonth,
  year: initialYear,
  rows: initialRows,
}: {
  month: string;
  year: string;
  rows: ChartRow[];
}) {
  const [currentDate, setCurrentDate] = useState(
    new Date(Number(initialYear), new Date(`${initialMonth} 1, ${initialYear}`).getMonth())
  );
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
    <div className="">
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

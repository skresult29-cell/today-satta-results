"use client";

import type { ChartRecord } from "@/types";

export function ChartTable({ records, gameName }: { records: ChartRecord[]; gameName: string }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No records available for this month.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1e3a5f] text-white">
            <th className="px-4 py-3 text-left font-semibold">Date</th>
            <th className="px-4 py-3 text-left font-semibold">Day</th>
            <th className="px-4 py-3 text-center font-semibold">{gameName} Result</th>
            <th className="px-4 py-3 text-center font-semibold">Time</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, idx) => (
            <tr
              key={record.date}
              className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
            >
              <td className="px-4 py-2.5 font-medium text-gray-700">
                {record.date}
              </td>
              <td className="px-4 py-2.5 text-gray-600">{record.day}</td>
              <td className="px-4 py-2.5 text-center">
                <span className="inline-block bg-emerald-100 text-emerald-800 font-mono font-bold px-3 py-1 rounded-lg text-base">
                  {record.result}
                </span>
              </td>
              <td className="px-4 py-2.5 text-center text-gray-500">
                {record.resultTime}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

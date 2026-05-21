"use client";

import { useEffect, useState } from "react";
import { subscribeToDailyResults } from "@/lib/firestore";
import type { DailyResult } from "@/types";
import { getTodayDateString } from "@/lib/utils";

export function useLiveResults(date?: string) {
  const [results, setResults] = useState<DailyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetDate = date || getTodayDateString();
    const unsubscribe = subscribeToDailyResults(targetDate, (data) => {
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [date]);

  return { results, loading };
}

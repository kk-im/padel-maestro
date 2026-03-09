"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DailyLog } from "@/types";

export function useDateRangeLogs(startDate: string, endDate: string) {
  const [logs, setLogs] = useState<Map<string, DailyLog>>(new Map());
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const supabase = createClient();
    let cancelled = false;

    async function load() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      userIdRef.current = user.id;

      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date");

      if (!cancelled && data) {
        const map = new Map<string, DailyLog>();
        for (const row of data) {
          map.set(row.date, row as DailyLog);
        }
        setLogs(map);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  const upsertLog = useCallback(
    async (date: string, updates: Partial<DailyLog>) => {
      const userId = userIdRef.current;
      if (!userId) return;

      // Optimistic update
      setLogs((prev) => {
        const next = new Map(prev);
        const existing = next.get(date);
        const base: DailyLog = existing ?? {
          id: "",
          user_id: userId,
          date,
          status: null,
          feeling: null,
          process_goal_1: null,
          process_goal_2: null,
          notes: null,
          custom_session_title: null,
          custom_session_duration: null,
          custom_session_focus: null,
          cost_usd: null,
          created_at: "",
          updated_at: "",
        };
        next.set(date, { ...base, ...updates });
        return next;
      });

      const supabase = createClient();
      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          { user_id: userId, date, ...updates },
          { onConflict: "user_id,date" }
        );

      if (error) {
        console.error("Failed to upsert daily log:", error);
      }
    },
    []
  );

  return { logs, loading, upsertLog };
}

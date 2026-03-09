"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DailyLog } from "@/types";

interface DashboardStats {
  sessionsCompleted: number;
  matchesPlayed: number;
  avgSkillRating: number | null;
  streak: number;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    sessionsCompleted: 0,
    matchesPlayed: 0,
    avgSkillRating: null,
    streak: 0,
  });
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all in parallel
      const [logsRes, matchesRes, ratingsRes] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
        supabase
          .from("matches")
          .select("id")
          .eq("user_id", user.id),
        supabase
          .from("skill_ratings")
          .select("rating")
          .eq("user_id", user.id)
          .eq("month", new Date().toISOString().slice(0, 7)),
      ]);

      const logs = (logsRes.data ?? []) as DailyLog[];
      const completedLogs = logs.filter((l) => l.status === "completed");
      const matchCount = matchesRes.data?.length ?? 0;

      // Avg skill rating
      const ratings = ratingsRes.data ?? [];
      let avgRating: number | null = null;
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + (r.rating ?? 0), 0);
        avgRating = Math.round((sum / ratings.length) * 10) / 10;
      }

      // Streak: consecutive days with completed status from today backwards
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLog = logs.find((l) => l.date === dateStr);
        if (dayLog?.status === "completed") {
          streak++;
        } else if (i > 0) {
          // Skip today if not logged yet
          break;
        }
      }

      setStats({
        sessionsCompleted: completedLogs.length,
        matchesPlayed: matchCount,
        avgSkillRating: avgRating,
        streak,
      });

      setRecentLogs(logs.slice(0, 5));
      setLoading(false);
    }

    load();
  }, []);

  return { stats, recentLogs, loading };
}

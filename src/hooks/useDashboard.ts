"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DailyLog, DailyActivity } from "@/types";

interface DashboardStats {
  sessionsCompleted: number;
  matchesPlayed: number;
  tournamentsPlayed: number;
  totalSpentUsd: number;
  streak: number;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    sessionsCompleted: 0,
    matchesPlayed: 0,
    tournamentsPlayed: 0,
    totalSpentUsd: 0,
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

      const [activitiesRes, logsRes] = await Promise.all([
        supabase
          .from("daily_activities")
          .select("session_type, cost_usd, date")
          .eq("user_id", user.id),
        supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
      ]);

      const activities = (activitiesRes.data ?? []) as Pick<
        DailyActivity,
        "session_type" | "cost_usd" | "date"
      >[];
      const allLogs = (logsRes.data ?? []) as DailyLog[];

      const sessionsCompleted = activities.filter(
        (a) =>
          a.session_type !== "match" &&
          a.session_type !== "tournament" &&
          a.session_type !== "rest"
      ).length;

      const matchesPlayed = activities.filter(
        (a) => a.session_type === "match"
      ).length;

      const tournamentsPlayed = activities.filter(
        (a) => a.session_type === "tournament"
      ).length;

      const activitySpend = activities.reduce(
        (sum, a) => sum + (a.cost_usd ?? 0),
        0
      );
      const logSpend = allLogs.reduce(
        (sum, l) => sum + (l.cost_usd ?? 0),
        0
      );
      const totalSpentUsd = activitySpend + logSpend;

      // Streak: consecutive days with at least one activity logged
      const activityDates = new Set(activities.map((a) => a.date));
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        if (activityDates.has(dateStr)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      setStats({
        sessionsCompleted,
        matchesPlayed,
        tournamentsPlayed,
        totalSpentUsd,
        streak,
      });

      setRecentLogs(allLogs.slice(0, 5));
      setLoading(false);
    }

    load();
  }, []);

  return { stats, recentLogs, loading };
}

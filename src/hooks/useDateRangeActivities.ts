"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DailyActivity } from "@/types";

const DEBOUNCE_MS = 1000;

export function useDateRangeActivities(startDate: string, endDate: string) {
  const [activities, setActivities] = useState<Map<string, DailyActivity[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);
  const debounceRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

      const { data, error } = await supabase
        .from("daily_activities")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("created_at", { ascending: true });

      if (error) console.error("[useDateRangeActivities] query error:", error);

      if (!cancelled && data) {
        const map = new Map<string, DailyActivity[]>();
        for (const row of data as DailyActivity[]) {
          const list = map.get(row.date) ?? [];
          list.push(row);
          map.set(row.date, list);
        }
        setActivities(map);
      }

      if (!cancelled) setLoading(false);
    }

    load();

    // Subscribe to realtime changes so Plan tab reflects Today tab inserts
    const channel = supabase
      .channel(`activities-${startDate}-${endDate}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_activities" },
        () => { if (!cancelled) load(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate]);

  // Cleanup debounces on unmount
  useEffect(() => {
    return () => {
      debounceRefs.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const addActivity = useCallback((date: string, fields: { description: string; session_type?: string; focus?: string; comment?: string | null; duration_minutes?: number | null; cost_usd?: number | null }) => {
    const userId = userIdRef.current;
    if (!userId) return;

    const supabase = createClient();
    const row = {
      user_id: userId,
      date,
      description: fields.description,
      session_type: fields.session_type ?? null,
      focus: fields.focus ?? null,
      comment: fields.comment ?? null,
      duration_minutes: fields.duration_minutes ?? null,
      cost_usd: fields.cost_usd ?? null,
    };

    supabase
      .from("daily_activities")
      .insert(row)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to add activity:", error);
          return;
        }
        if (data) {
          setActivities((prev) => {
            const next = new Map(prev);
            const list = [...(next.get(date) ?? []), data as DailyActivity];
            next.set(date, list);
            return next;
          });
        }
      });
  }, []);

  const deleteActivity = useCallback((date: string, id: string) => {
    // Clear any pending debounce
    const timer = debounceRefs.current.get(id);
    if (timer) {
      clearTimeout(timer);
      debounceRefs.current.delete(id);
    }

    // Optimistic removal
    setActivities((prev) => {
      const next = new Map(prev);
      const list = (next.get(date) ?? []).filter((a) => a.id !== id);
      if (list.length > 0) {
        next.set(date, list);
      } else {
        next.delete(date);
      }
      return next;
    });

    const supabase = createClient();
    supabase
      .from("daily_activities")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to delete activity:", error);
      });
  }, []);

  const updateDuration = useCallback((date: string, id: string, minutes: number | null) => {
    // Optimistic update
    setActivities((prev) => {
      const next = new Map(prev);
      const list = (next.get(date) ?? []).map((a) =>
        a.id === id ? { ...a, duration_minutes: minutes } : a
      );
      next.set(date, list);
      return next;
    });

    // Debounce the save
    const existing = debounceRefs.current.get(id);
    if (existing) clearTimeout(existing);

    debounceRefs.current.set(
      id,
      setTimeout(() => {
        debounceRefs.current.delete(id);
        const supabase = createClient();
        supabase
          .from("daily_activities")
          .update({ duration_minutes: minutes })
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Failed to update duration:", error);
          });
      }, DEBOUNCE_MS)
    );
  }, []);

  const updateActivity = useCallback((id: string, fields: { description?: string; session_type?: string | null; focus?: string | null; comment?: string | null; duration_minutes?: number | null; cost_usd?: number | null }) => {
    setActivities((prev) => {
      const next = new Map(prev);
      for (const [date, list] of next) {
        const idx = list.findIndex((a) => a.id === id);
        if (idx >= 0) {
          const updated = [...list];
          updated[idx] = { ...updated[idx], ...fields };
          next.set(date, updated);
          break;
        }
      }
      return next;
    });

    const supabase = createClient();
    supabase
      .from("daily_activities")
      .update(fields)
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to update activity:", error);
      });
  }, []);

  return { activities, loading, addActivity, deleteActivity, updateDuration, updateActivity };
}

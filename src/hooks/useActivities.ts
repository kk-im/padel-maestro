"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDateStr } from "@/lib/utils/dates";
import type { DailyActivity } from "@/types";

const DEBOUNCE_MS = 1000;

export function useActivities() {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);
  const debounceRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

      userIdRef.current = user.id;
      const today = getDateStr();

      const { data } = await supabase
        .from("daily_activities")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: true });

      if (data) {
        setActivities(data as DailyActivity[]);
      }

      setLoading(false);
    }

    load();

    return () => {
      debounceRefs.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const addActivity = useCallback((fields: { description: string; session_type?: string; focus?: string; comment?: string | null; duration_minutes?: number | null; cost_usd?: number | null }) => {
    const userId = userIdRef.current;
    if (!userId) return;

    const today = getDateStr();
    const supabase = createClient();
    const row = {
      user_id: userId,
      date: today,
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
          setActivities((prev) => [...prev, data as DailyActivity]);
        }
      });
  }, []);

  const deleteActivity = useCallback((id: string) => {
    // Clear any pending debounce for this activity
    const timer = debounceRefs.current.get(id);
    if (timer) {
      clearTimeout(timer);
      debounceRefs.current.delete(id);
    }

    setActivities((prev) => prev.filter((a) => a.id !== id));

    const supabase = createClient();
    supabase
      .from("daily_activities")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to delete activity:", error);
      });
  }, []);

  const updateComment = useCallback((id: string, comment: string) => {
    // Optimistic update
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, comment } : a))
    );

    // Debounce the save per activity
    const existing = debounceRefs.current.get(`comment-${id}`);
    if (existing) clearTimeout(existing);

    debounceRefs.current.set(
      `comment-${id}`,
      setTimeout(() => {
        debounceRefs.current.delete(`comment-${id}`);
        const supabase = createClient();
        supabase
          .from("daily_activities")
          .update({ comment })
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Failed to update comment:", error);
          });
      }, DEBOUNCE_MS)
    );
  }, []);

  const updateDuration = useCallback((id: string, minutes: number | null) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, duration_minutes: minutes } : a))
    );

    const existing = debounceRefs.current.get(`dur-${id}`);
    if (existing) clearTimeout(existing);

    debounceRefs.current.set(
      `dur-${id}`,
      setTimeout(() => {
        debounceRefs.current.delete(`dur-${id}`);
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

  return { activities, loading, addActivity, deleteActivity, updateComment, updateDuration };
}

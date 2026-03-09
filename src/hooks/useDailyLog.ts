"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDateStr } from "@/lib/utils/dates";
import type { DailyLog } from "@/types";

const DEBOUNCE_FIELDS = new Set(["notes", "process_goal_1", "process_goal_2"]);
const DEBOUNCE_MS = 1000;

export type SaveStatus = "idle" | "saving" | "saved";

export function useDailyLog() {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const userIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (data) {
        setLog(data as DailyLog);
      }

      setLoading(false);
    }

    load();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const updateLog = useCallback((updates: Partial<DailyLog>) => {
    const userId = userIdRef.current;
    if (!userId) return;

    const today = getDateStr();

    // Optimistic update
    setLog((prev) => {
      const base = prev ?? ({
        id: "",
        user_id: userId,
        date: today,
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
      } as DailyLog);
      return { ...base, ...updates };
    });

    const upsertData = {
      user_id: userId,
      date: today,
      ...updates,
    };

    // Check if any update key needs debouncing
    const needsDebounce = Object.keys(updates).some((k) =>
      DEBOUNCE_FIELDS.has(k)
    );

    const doUpsert = () => {
      setSaveStatus("saving");
      const supabase = createClient();
      supabase
        .from("daily_logs")
        .upsert(upsertData, { onConflict: "user_id,date" })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to save daily log:", error);
            setSaveStatus("idle");
          } else {
            setSaveStatus("saved");
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
          }
        });
    };

    if (needsDebounce) {
      setSaveStatus("saving");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(doUpsert, DEBOUNCE_MS);
    } else {
      doUpsert();
    }
  }, []);

  return { log, loading, updateLog, saveStatus };
}

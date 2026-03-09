"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Match } from "@/types";

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

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

      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (data) {
        setMatches(data as Match[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  const addMatch = useCallback((match: Partial<Match>) => {
    const userId = userIdRef.current;
    if (!userId) return;

    const supabase = createClient();
    const row = { ...match, user_id: userId };

    supabase
      .from("matches")
      .insert(row)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to save match:", error);
          return;
        }
        if (data) {
          setMatches((prev) => [data as Match, ...prev]);
        }
      });
  }, []);

  const deleteMatch = useCallback((id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));

    const supabase = createClient();
    supabase
      .from("matches")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to delete match:", error);
      });
  }, []);

  return { matches, loading, addMatch, deleteMatch };
}

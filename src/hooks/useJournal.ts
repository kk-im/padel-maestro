"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type EntriesMap = Record<string, string>;

function entryKey(month: string, prompt: string) {
  return `${month}::${prompt}`;
}

const DEBOUNCE_MS = 1000;

export function useJournal() {
  const [entries, setEntries] = useState<EntriesMap>({});
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        .from("journal_entries")
        .select("month, prompt, response")
        .eq("user_id", user.id);

      if (data) {
        const map: EntriesMap = {};
        for (const row of data) {
          if (row.response) {
            map[entryKey(row.month, row.prompt)] = row.response;
          }
        }
        setEntries(map);
      }

      setLoading(false);
    }

    load();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateEntry = useCallback(
    (month: string, prompt: string, response: string) => {
      const userId = userIdRef.current;
      if (!userId) return;

      setEntries((prev) => ({ ...prev, [entryKey(month, prompt)]: response }));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const supabase = createClient();
        supabase
          .from("journal_entries")
          .upsert(
            {
              user_id: userId,
              month,
              prompt,
              response,
            },
            { onConflict: "user_id,month,prompt" }
          )
          .then(({ error }) => {
            if (error) console.error("Failed to save journal entry:", error);
          });
      }, DEBOUNCE_MS);
    },
    []
  );

  return { entries, loading, updateEntry };
}

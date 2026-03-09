"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type SkillsMap = Record<string, number>;

function skillKey(month: string, category: string, skillName: string) {
  return `${month}::${category}::${skillName}`;
}

const DEBOUNCE_MS = 500;

export function useSkills() {
  const [skills, setSkills] = useState<SkillsMap>({});
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
        .from("skill_ratings")
        .select("month, category, skill_name, rating")
        .eq("user_id", user.id);

      if (data) {
        const map: SkillsMap = {};
        for (const row of data) {
          map[skillKey(row.month, row.category, row.skill_name)] = row.rating;
        }
        setSkills(map);
      }

      setLoading(false);
    }

    load();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateSkill = useCallback(
    (month: string, category: string, skillName: string, rating: number) => {
      const userId = userIdRef.current;
      if (!userId) return;

      const key = skillKey(month, category, skillName);

      // Optimistic update
      setSkills((prev) => ({ ...prev, [key]: rating }));

      // Debounced upsert
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const supabase = createClient();
        supabase
          .from("skill_ratings")
          .upsert(
            {
              user_id: userId,
              month,
              category,
              skill_name: skillName,
              rating,
            },
            { onConflict: "user_id,month,category,skill_name" }
          )
          .then(({ error }) => {
            if (error) console.error("Failed to save skill rating:", error);
          });
      }, DEBOUNCE_MS);
    },
    []
  );

  return { skills, loading, updateSkill };
}

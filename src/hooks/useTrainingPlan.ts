"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SESSION_TYPE_ICONS } from "@/lib/data/constants";
import type { PlanData, SessionTemplate } from "@/types";

export function useTrainingPlan() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

      const { data } = await supabase
        .from("training_plans")
        .select("id, plan_data")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (data) {
        setPlan(data.plan_data as PlanData);
        setPlanId(data.id);
      }

      setLoading(false);
    }

    load();
  }, []);

  const updateSession = useCallback(
    async (
      phaseNumber: number,
      dayName: string,
      updated: Partial<SessionTemplate>
    ) => {
      if (!plan || !planId) return;

      const newPlan = structuredClone(plan);
      const phase = newPlan.phases.find((p) => p.number === phaseNumber);
      if (!phase) return;

      const existing = phase.weekly_schedule[dayName];
      if (!existing) return;

      const merged = { ...existing, ...updated };
      if (updated.type && !updated.icon) {
        merged.icon = SESSION_TYPE_ICONS[updated.type] ?? existing.icon;
      }
      phase.weekly_schedule[dayName] = merged;

      // Optimistic update
      setPlan(newPlan);
      setSaving(true);

      const supabase = createClient();
      const { error } = await supabase
        .from("training_plans")
        .update({ plan_data: newPlan as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
        .eq("id", planId);

      if (error) {
        console.error("Failed to update session:", error);
        setPlan(plan); // revert
      }

      setSaving(false);
    },
    [plan, planId]
  );

  return { plan, planId, loading, saving, updateSession };
}

"use client";

import { useMemo } from "react";
import { useProfile } from "./useProfile";
import { useTrainingPlan } from "./useTrainingPlan";
import { getDay, getCurrentPhase, getDayOfWeek, getDateStr, getMonthLabels } from "@/lib/utils/dates";
import type { Phase } from "@/types";

export function useDay() {
  const { profile, loading: profileLoading } = useProfile();
  const { plan, loading: planLoading } = useTrainingPlan();

  const loading = profileLoading || planLoading;

  const data = useMemo(() => {
    if (!profile || !plan) {
      return {
        dayNum: 1,
        totalDays: 365,
        currentPhase: null as Phase | null,
        dayOfWeek: getDayOfWeek(),
        dateStr: getDateStr(),
        monthLabels: [] as string[],
        startDate: "",
      };
    }

    const dayNum = getDay(profile.start_date);
    const currentPhase = getCurrentPhase(dayNum, plan.phases);
    const dayOfWeek = getDayOfWeek();
    const dateStr = getDateStr();
    const totalDays = profile.challenge_duration_days;
    const monthLabels = getMonthLabels(profile.start_date, totalDays);

    return { dayNum, totalDays, currentPhase, dayOfWeek, dateStr, monthLabels, startDate: profile.start_date };
  }, [profile, plan]);

  return { ...data, loading };
}

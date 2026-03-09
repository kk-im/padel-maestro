"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type MetricMap = Record<string, string>;

function metricKey(month: string, metricName: string) {
  return `${month}::${metricName}`;
}

const DEBOUNCE_MS = 500;

export function useFitness() {
  const [fitness, setFitness] = useState<MetricMap>({});
  const [body, setBody] = useState<MetricMap>({});
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);
  const fitDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      const [fitRes, bodyRes] = await Promise.all([
        supabase
          .from("fitness_benchmarks")
          .select("month, metric_name, value")
          .eq("user_id", user.id),
        supabase
          .from("body_measurements")
          .select("month, metric_name, value")
          .eq("user_id", user.id),
      ]);

      if (fitRes.data) {
        const map: MetricMap = {};
        for (const row of fitRes.data) {
          map[metricKey(row.month, row.metric_name)] = row.value?.toString() ?? "";
        }
        setFitness(map);
      }

      if (bodyRes.data) {
        const map: MetricMap = {};
        for (const row of bodyRes.data) {
          map[metricKey(row.month, row.metric_name)] = row.value?.toString() ?? "";
        }
        setBody(map);
      }

      setLoading(false);
    }

    load();

    return () => {
      if (fitDebounceRef.current) clearTimeout(fitDebounceRef.current);
      if (bodyDebounceRef.current) clearTimeout(bodyDebounceRef.current);
    };
  }, []);

  const updateFitness = useCallback(
    (month: string, metric: string, value: string) => {
      const userId = userIdRef.current;
      if (!userId) return;

      setFitness((prev) => ({ ...prev, [metricKey(month, metric)]: value }));

      if (fitDebounceRef.current) clearTimeout(fitDebounceRef.current);
      fitDebounceRef.current = setTimeout(() => {
        const supabase = createClient();
        supabase
          .from("fitness_benchmarks")
          .upsert(
            {
              user_id: userId,
              month,
              metric_name: metric,
              value: value === "" ? null : parseFloat(value),
            },
            { onConflict: "user_id,month,metric_name" }
          )
          .then(({ error }) => {
            if (error) console.error("Failed to save fitness benchmark:", error);
          });
      }, DEBOUNCE_MS);
    },
    []
  );

  const updateBody = useCallback(
    (month: string, metric: string, value: string) => {
      const userId = userIdRef.current;
      if (!userId) return;

      setBody((prev) => ({ ...prev, [metricKey(month, metric)]: value }));

      if (bodyDebounceRef.current) clearTimeout(bodyDebounceRef.current);
      bodyDebounceRef.current = setTimeout(() => {
        const supabase = createClient();
        supabase
          .from("body_measurements")
          .upsert(
            {
              user_id: userId,
              month,
              metric_name: metric,
              value: value === "" ? null : parseFloat(value),
            },
            { onConflict: "user_id,month,metric_name" }
          )
          .then(({ error }) => {
            if (error) console.error("Failed to save body measurement:", error);
          });
      }, DEBOUNCE_MS);
    },
    []
  );

  return { fitness, body, loading, updateFitness, updateBody };
}

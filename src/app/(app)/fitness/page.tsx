"use client";

import { useState } from "react";
import { useFitness } from "@/hooks/useFitness";
import { useTrainingPlan } from "@/hooks/useTrainingPlan";
import { useDay } from "@/hooks/useDay";

const cardStyle: React.CSSProperties = {
  background: "var(--bg-glass)",
  border: "1px solid var(--bg-glass-border)",
  backdropFilter: "blur(20px)",
  borderRadius: "var(--radius-md)",
  padding: "20px",
  marginBottom: "16px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--text-secondary)",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "10px",
};

const numInputStyle: React.CSSProperties = {
  width: "80px",
  padding: "8px 10px",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "#fff",
  border: "1px solid rgba(0,0,0,0.06)",
  fontSize: "15px",
  fontWeight: 600,
  color: "var(--text-primary)",
  outline: "none",
  textAlign: "right",
  fontFamily: "inherit",
};

export default function FitnessPage() {
  const { fitness, body, loading: fitLoading, updateFitness, updateBody } = useFitness();
  const { plan, loading: planLoading } = useTrainingPlan();
  const { monthLabels, loading: dayLoading } = useDay();
  const [selectedMonth, setSelectedMonth] = useState("Baseline");
  const [tab, setTab] = useState<"fitness" | "body">("fitness");

  const loading = fitLoading || planLoading || dayLoading;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Loading...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "12px" }}>
        <p style={{ fontSize: "18px", fontWeight: 500 }}>No training plan found</p>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Complete onboarding to generate your plan.</p>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="font-[family-name:var(--font-outfit)]"
        style={{ fontSize: "28px", fontWeight: 700, marginBottom: "20px" }}
      >
        Fitness
      </h1>

      {/* A) Sub-tab Toggle */}
      <div
        style={{
          display: "inline-flex",
          background: "var(--bg-glass)",
          padding: "4px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--bg-glass-border)",
          marginBottom: "20px",
        }}
      >
        {(["fitness", "body"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 24px",
              borderRadius: "var(--radius-pill)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              backgroundColor: tab === t ? "#fff" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {t === "fitness" ? "Fitness" : "Body"}
          </button>
        ))}
      </div>

      {/* B) Month Selector */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {monthLabels.map((month) => {
          const active = selectedMonth === month;
          return (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-pill)",
                fontSize: "14px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                backgroundColor: active ? "var(--text-primary)" : "#fff",
                color: active ? "#fff" : "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {month}
            </button>
          );
        })}
      </div>

      {/* C) Fitness View */}
      {tab === "fitness" &&
        Object.entries(plan.fitness_metrics).map(([category, metrics]) => (
          <div key={category} style={cardStyle}>
            <p style={labelStyle}>{category}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {metrics.map((metric) => {
                const key = `${selectedMonth}::${metric.name}`;
                return (
                  <div
                    key={metric.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 500 }}>{metric.name}</p>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {metric.how}
                      </p>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={fitness[key] ?? ""}
                      onChange={(e) => updateFitness(selectedMonth, metric.name, e.target.value)}
                      placeholder="—"
                      style={numInputStyle}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {/* D) Body View */}
      {tab === "body" && (
        <div style={cardStyle}>
          <p style={labelStyle}>Body Measurements</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {plan.body_metrics.map((metric) => {
              const key = `${selectedMonth}::${metric}`;
              return (
                <div
                  key={metric}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>{metric}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={body[key] ?? ""}
                    onChange={(e) => updateBody(selectedMonth, metric, e.target.value)}
                    placeholder="—"
                    style={numInputStyle}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

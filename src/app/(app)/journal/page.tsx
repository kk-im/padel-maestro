"use client";

import { useState } from "react";
import { useJournal } from "@/hooks/useJournal";
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

export default function JournalPage() {
  const { entries, loading: journalLoading, updateEntry } = useJournal();
  const { plan, loading: planLoading } = useTrainingPlan();
  const { monthLabels, loading: dayLoading } = useDay();

  // Active months = all except "Baseline"
  const activeMonths = monthLabels.filter((m) => m !== "Baseline");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const loading = journalLoading || planLoading || dayLoading;

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

  const month = selectedMonth ?? activeMonths[0] ?? "January";
  const prompts = plan.journal_prompts;

  const filledCount = prompts.filter((p) => {
    const val = entries[`${month}::${p}`];
    return val && val.trim().length > 0;
  }).length;

  return (
    <div>
      <h1
        className="font-[family-name:var(--font-outfit)]"
        style={{ fontSize: "28px", fontWeight: 700, marginBottom: "20px" }}
      >
        Journal
      </h1>

      {/* A) Month Selector */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {activeMonths.map((m) => {
          const active = month === m;
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
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
              {m}
            </button>
          );
        })}
      </div>

      {/* B) Completion Indicator */}
      <div
        style={{
          ...cardStyle,
          backgroundColor: "var(--bg-card-yellow)",
          border: "none",
          textAlign: "center",
        }}
      >
        <p
          className="font-[family-name:var(--font-outfit)]"
          style={{ fontSize: "42px", fontWeight: 700, lineHeight: 1 }}
        >
          {filledCount}/{prompts.length}
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-primary)", opacity: 0.7, marginTop: "6px" }}>
          prompts completed for {month}
        </p>
      </div>

      {/* C) Prompt Cards */}
      {prompts.map((prompt, i) => {
        const key = `${month}::${prompt}`;
        const value = entries[key] ?? "";
        const filled = value.trim().length > 0;

        return (
          <div key={i} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
              {filled && (
                <span style={{ color: "#7DB87D", fontSize: "16px", lineHeight: 1, marginTop: "1px" }}>&#10003;</span>
              )}
              <p style={{ ...labelStyle, marginBottom: 0 }}>{prompt}</p>
            </div>
            <textarea
              value={value}
              onChange={(e) => updateEntry(month, prompt, e.target.value)}
              placeholder="Write your reflection..."
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.06)",
                fontSize: "15px",
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

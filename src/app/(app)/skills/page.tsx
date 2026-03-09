"use client";

import { useState } from "react";
import { useSkills } from "@/hooks/useSkills";
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

export default function SkillsPage() {
  const { skills, loading: skillsLoading, updateSkill } = useSkills();
  const { plan, loading: planLoading } = useTrainingPlan();
  const { monthLabels, loading: dayLoading } = useDay();
  const [selectedMonth, setSelectedMonth] = useState("Baseline");

  const loading = skillsLoading || planLoading || dayLoading;

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

  // Calculate average and count
  const categories = plan.skill_categories;
  const allSkillKeys: string[] = [];
  for (const [cat, skillList] of Object.entries(categories)) {
    for (const skill of skillList) {
      allSkillKeys.push(`${selectedMonth}::${cat}::${skill}`);
    }
  }

  const ratedValues = allSkillKeys
    .map((k) => skills[k])
    .filter((v) => v !== undefined && v !== null);

  const ratedCount = ratedValues.length;
  const totalCount = allSkillKeys.length;
  const average = ratedCount > 0
    ? (ratedValues.reduce((a, b) => a + b, 0) / ratedCount).toFixed(1)
    : "—";

  return (
    <div>
      <h1
        className="font-[family-name:var(--font-outfit)]"
        style={{ fontSize: "28px", fontWeight: 700, marginBottom: "20px" }}
      >
        Skills
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

      {/* B) Average */}
      <div
        style={{
          ...cardStyle,
          backgroundColor: "var(--bg-card-peach)",
          border: "none",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "42px", fontWeight: 700, lineHeight: 1 }} className="font-[family-name:var(--font-outfit)]">
          {average}
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-primary)", opacity: 0.7, marginTop: "6px" }}>
          Average — {ratedCount} of {totalCount} skills rated
        </p>
      </div>

      {/* C) Skill Category Cards */}
      {Object.entries(categories).map(([category, skillList]) => (
        <div key={category} style={cardStyle}>
          <p style={labelStyle}>{category}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {skillList.map((skillName) => {
              const key = `${selectedMonth}::${category}::${skillName}`;
              const value = skills[key] ?? 0;

              return (
                <div key={skillName}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>{skillName}</span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        minWidth: "24px",
                        textAlign: "right",
                      }}
                    >
                      {value || "—"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={value || 1}
                    onChange={(e) =>
                      updateSkill(selectedMonth, category, skillName, parseInt(e.target.value))
                    }
                    style={{
                      width: "100%",
                      height: "6px",
                      appearance: "none",
                      background: `linear-gradient(to right, var(--text-primary) ${((value || 1) - 1) * 11.1}%, rgba(0,0,0,0.08) ${((value || 1) - 1) * 11.1}%)`,
                      borderRadius: "3px",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

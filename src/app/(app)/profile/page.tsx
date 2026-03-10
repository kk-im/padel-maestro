"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useDay } from "@/hooks/useDay";
import { useDashboard } from "@/hooks/useDashboard";
import { Icon, ChevronDownIcon, ChevronUpIcon, CheckIcon } from "@/components/ui/Icons";
import { FEELINGS } from "@/lib/data/constants";

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

const statCardStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "var(--radius-md)",
  backgroundColor: "#fff",
  border: "1px solid rgba(0,0,0,0.04)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const { profile, loading: profileLoading } = useProfile();
  const { dayNum, totalDays, currentPhase, loading: dayLoading } = useDay();
  const { stats, recentLogs, loading: dashLoading } = useDashboard();
  const [showDetails, setShowDetails] = useState(false);

  const loading = profileLoading || dayLoading || dashLoading;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "12px" }}>
        <p style={{ fontSize: "18px", fontWeight: 500 }}>No profile found</p>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Complete onboarding first.</p>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((dayNum / totalDays) * 100));
  const daysRemaining = Math.max(0, totalDays - dayNum);

  return (
    <div>
      {/* 1) Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-card-yellow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {getInitials(profile.name)}
        </div>
        <div>
          <h1
            className="font-[family-name:var(--font-outfit)]"
            style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2 }}
          >
            {profile.name ?? "Player"}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>
            {profile.playing_level ?? "—"} → {profile.target_level ?? "—"}
          </p>
        </div>
      </div>

      {/* 2) Challenge Progress */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <p style={labelStyle}>Challenge Progress</p>
          <span style={{ fontSize: "13px", fontWeight: 600 }}>
            Day {dayNum} of {totalDays}
          </span>
        </div>

        <div
          style={{
            height: "8px",
            backgroundColor: "rgba(0,0,0,0.06)",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              backgroundColor: "var(--text-primary)",
              borderRadius: "4px",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)" }}>
          <span>{currentPhase ? `Phase ${currentPhase.number}: ${currentPhase.name}` : "—"}</span>
          <span>{daysRemaining} days left</span>
        </div>
      </div>

      {/* 3) Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        <div style={statCardStyle}>
          <span style={{ fontSize: "28px", fontWeight: 700 }}>{stats.sessionsCompleted}</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Sessions</span>
        </div>
        <div style={statCardStyle}>
          <span style={{ fontSize: "28px", fontWeight: 700 }}>{stats.matchesPlayed}</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Matches</span>
        </div>
        <div style={statCardStyle}>
          <span style={{ fontSize: "28px", fontWeight: 700 }}>{stats.tournamentsPlayed}</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Tournaments</span>
        </div>
        <div style={statCardStyle}>
          <span style={{ fontSize: "28px", fontWeight: 700 }}>{stats.streak}</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Day Streak</span>
        </div>
      </div>

      {/* Total Spend */}
      <div
        style={{
          ...cardStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>Total Spent</span>
        <span style={{ fontSize: "22px", fontWeight: 700 }}>
          ${stats.totalSpentUsd.toFixed(2)}
        </span>
      </div>

      {/* 4) Recent Activity */}
      {recentLogs.length > 0 && (
        <div style={cardStyle}>
          <p style={labelStyle}>Recent Activity</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentLogs.map((log) => {
              const feeling = FEELINGS.find((f) => f.value === log.feeling);
              return (
                <div
                  key={log.id || log.date}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "#fff",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", minWidth: "72px" }}>
                      {log.date}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "2px 10px",
                        borderRadius: "var(--radius-pill)",
                        backgroundColor: log.status === "completed"
                          ? "rgba(46, 160, 67, 0.12)"
                          : log.status === "skipped"
                          ? "rgba(0,0,0,0.05)"
                          : "rgba(235, 245, 95, 0.3)",
                        color: log.status === "completed" ? "#1a7f37" : "var(--text-primary)",
                      }}
                    >
                      {log.status ?? "—"}
                    </span>
                  </div>
                  {feeling && (
                    <Icon name={feeling.icon} size={18} style={{ color: "var(--text-secondary)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5) Phase Milestones */}
      {currentPhase && (
        <div style={cardStyle}>
          <p style={labelStyle}>Phase {currentPhase.number} Milestones</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <CheckIcon size={16} style={{ color: "var(--text-secondary)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>
                  Technical
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.4 }}>{currentPhase.milestones.technical}</p>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <CheckIcon size={16} style={{ color: "var(--text-secondary)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>
                  Physical
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.4 }}>{currentPhase.milestones.physical}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6) Profile Details (collapsible) */}
      <div style={cardStyle}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
            color: "var(--text-primary)",
          }}
        >
          <p style={{ ...labelStyle, marginBottom: 0 }}>Profile Details</p>
          {showDetails ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
        </button>

        {showDetails && (
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              ["Height", profile.height_cm ? `${profile.height_cm} cm` : null],
              ["Weight", profile.weight_kg ? `${profile.weight_kg} kg` : null],
              ["Age", profile.age],
              ["Dominant Hand", profile.dominant_hand],
              ["Preferred Side", profile.preferred_side],
              ["Playing Frequency", profile.playing_frequency],
              ["Coaching", profile.coaching_frequency],
              ["Goals", profile.goals],
              ["Injuries / Limitations", profile.injuries_or_limitations],
            ]
              .filter(([, v]) => v != null && v !== "")
              .map(([label, value]) => (
                <div
                  key={label as string}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{label as string}</span>
                  <span style={{ fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{String(value)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

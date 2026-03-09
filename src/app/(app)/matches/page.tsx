"use client";

import { useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import { getDateStr, formatDate } from "@/lib/utils/dates";
import type { Match } from "@/types";

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
  marginBottom: "6px",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "#fff",
  border: "1px solid rgba(0,0,0,0.06)",
  fontSize: "14px",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "inherit",
};

const numSmallStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "#fff",
  border: "1px solid rgba(0,0,0,0.06)",
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--text-primary)",
  outline: "none",
  textAlign: "center",
  fontFamily: "inherit",
};

interface FormState {
  date: string;
  result: string;
  opponent_level: string;
  ue_net: string;
  ue_long: string;
  grip_losses: string;
  chiquitas_good: string;
  chiquitas_total: string;
  viboras_good: string;
  viboras_total: string;
  bajadas_good: string;
  bajadas_total: string;
  went_well: string;
  to_improve: string;
}

const emptyForm: FormState = {
  date: getDateStr(),
  result: "",
  opponent_level: "",
  ue_net: "",
  ue_long: "",
  grip_losses: "",
  chiquitas_good: "",
  chiquitas_total: "",
  viboras_good: "",
  viboras_total: "",
  bajadas_good: "",
  bajadas_total: "",
  went_well: "",
  to_improve: "",
};

function numOrNull(val: string): number | null {
  return val === "" ? null : parseInt(val);
}

export default function MatchesPage() {
  const { matches, loading, addMatch, deleteMatch } = useMatches();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    const match: Partial<Match> = {
      date: form.date,
      result: form.result || null,
      opponent_level: form.opponent_level || null,
      ue_net: numOrNull(form.ue_net),
      ue_long: numOrNull(form.ue_long),
      grip_losses: numOrNull(form.grip_losses),
      chiquitas_good: numOrNull(form.chiquitas_good),
      chiquitas_total: numOrNull(form.chiquitas_total),
      viboras_good: numOrNull(form.viboras_good),
      viboras_total: numOrNull(form.viboras_total),
      bajadas_good: numOrNull(form.bajadas_good),
      bajadas_total: numOrNull(form.bajadas_total),
      went_well: form.went_well || null,
      to_improve: form.to_improve || null,
    };

    addMatch(match);
    setForm({ ...emptyForm, date: getDateStr() });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Loading...</p>
      </div>
    );
  }

  const statPill = (label: string, value: number | null) => {
    if (value === null || value === undefined) return null;
    return (
      <span
        style={{
          padding: "2px 10px",
          borderRadius: "var(--radius-pill)",
          backgroundColor: "rgba(0,0,0,0.05)",
          fontSize: "12px",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {label}: {value}
      </span>
    );
  };

  const ratePill = (label: string, good: number | null, total: number | null) => {
    if (good === null || total === null) return null;
    return (
      <span
        style={{
          padding: "2px 10px",
          borderRadius: "var(--radius-pill)",
          backgroundColor: "rgba(0,0,0,0.05)",
          fontSize: "12px",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {label}: {good}/{total}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1
          className="font-[family-name:var(--font-outfit)]"
          style={{ fontSize: "28px", fontWeight: 700 }}
        >
          Matches
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "8px 20px",
            borderRadius: "var(--radius-pill)",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            backgroundColor: showForm ? "#fff" : "var(--text-primary)",
            color: showForm ? "var(--text-primary)" : "#fff",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {showForm ? "Cancel" : "+ Log Match"}
        </button>
      </div>

      {/* B) Match Form */}
      {showForm && (
        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Result</label>
              <input value={form.result} onChange={(e) => set("result", e.target.value)} placeholder="e.g. W 6-3 6-4" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Opponent level</label>
            <input value={form.opponent_level} onChange={(e) => set("opponent_level", e.target.value)} placeholder="e.g. High bronze" style={inputStyle} />
          </div>

          <p style={{ ...labelStyle, marginBottom: "12px", marginTop: "8px" }}>Shot Tracking</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
            {([
              ["ue_net", "UE Net"],
              ["ue_long", "UE Long"],
              ["grip_losses", "Grip Losses"],
            ] as const).map(([field, label]) => (
              <div key={field}>
                <label style={{ ...labelStyle, fontSize: "11px" }}>{label}</label>
                <input type="number" inputMode="numeric" value={form[field]} onChange={(e) => set(field, e.target.value)} placeholder="0" style={numSmallStyle} />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "12px" }}>
            {([
              ["chiquitas_good", "Chiq Good"],
              ["chiquitas_total", "Chiq Total"],
              ["viboras_good", "Vib Good"],
              ["viboras_total", "Vib Total"],
              ["bajadas_good", "Baj Good"],
              ["bajadas_total", "Baj Total"],
            ] as const).map(([field, label]) => (
              <div key={field}>
                <label style={{ ...labelStyle, fontSize: "11px" }}>{label}</label>
                <input type="number" inputMode="numeric" value={form[field]} onChange={(e) => set(field, e.target.value)} placeholder="0" style={numSmallStyle} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>What went well?</label>
            <textarea value={form.went_well} onChange={(e) => set("went_well", e.target.value)} rows={2} placeholder="Strengths and highlights..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>What to improve?</label>
            <textarea value={form.to_improve} onChange={(e) => set("to_improve", e.target.value)} rows={2} placeholder="Areas to work on..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <button
            onClick={handleSave}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--bg-card-peach)",
              color: "var(--text-primary)",
              fontSize: "15px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Save Match
          </button>
        </div>
      )}

      {/* C) Match List */}
      {matches.length === 0 && !showForm && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>No matches logged yet.</p>
        </div>
      )}

      {matches.map((m) => (
        <div
          key={m.id}
          style={{
            backgroundColor: "#fff",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            marginBottom: "10px",
            border: "1px solid rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 600 }}>{m.result || "No result"}</p>
              {m.opponent_level && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>vs {m.opponent_level}</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{formatDate(m.date)}</p>
              <button
                onClick={() => deleteMatch(m.id)}
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: "2px 0",
                  marginTop: "2px",
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Stat pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
            {statPill("UE net", m.ue_net)}
            {statPill("UE long", m.ue_long)}
            {statPill("Grip", m.grip_losses)}
            {ratePill("Chiq", m.chiquitas_good, m.chiquitas_total)}
            {ratePill("Vib", m.viboras_good, m.viboras_total)}
            {ratePill("Baj", m.bajadas_good, m.bajadas_total)}
          </div>

          {m.went_well && (
            <p style={{ fontSize: "13px", lineHeight: 1.4, marginBottom: "4px" }}>
              <span style={{ color: "#7DB87D" }}>&#10003;</span> {m.went_well}
            </p>
          )}
          {m.to_improve && (
            <p style={{ fontSize: "13px", lineHeight: 1.4, color: "var(--text-secondary)" }}>
              <span>&#8593;</span> {m.to_improve}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

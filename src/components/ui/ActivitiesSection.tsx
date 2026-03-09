"use client";

import { useState } from "react";
import { useActivities } from "@/hooks/useActivities";
import { SESSION_TYPE_ICONS, SESSION_DURATIONS, SESSION_FOCUSES } from "@/lib/data/constants";
import { Icon } from "@/components/ui/Icons";
import { parseDurationToMinutes, formatMinutes } from "@/lib/utils/duration";
import { CURRENCIES, toUSD, formatUSD } from "@/lib/utils/currency";
import type { CurrencyCode } from "@/lib/utils/currency";

const cardStyle: React.CSSProperties = {
  background: "var(--bg-glass)",
  border: "1px solid var(--bg-glass-border)",
  backdropFilter: "blur(20px)",
  borderRadius: "var(--radius-md)",
  padding: "0",
  marginBottom: "16px",
  overflow: "hidden",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--text-secondary)",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "#fff",
  border: "1px solid rgba(0,0,0,0.06)",
  fontSize: "15px",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: "36px",
};

const ACTIVITY_TYPES = [
  { type: "coach", label: "Coach Session" },
  { type: "match", label: "Game" },
  { type: "gym", label: "Gym" },
  { type: "drilling", label: "Drilling" },
  { type: "recovery", label: "Recovery" },
] as const;

type ActivityType = typeof ACTIVITY_TYPES[number]["type"];

const emptyDetails = { title: "", duration: "", focus: "", costAmount: "", costCurrency: "USD" as CurrencyCode };

export function ActivitiesSection() {
  const { activities, loading, addActivity, deleteActivity } = useActivities();
  const [activeType, setActiveType] = useState<ActivityType | null>(null);
  const [details, setDetails] = useState(emptyDetails);

  if (loading) return null;

  const canSave = true; // type alone is enough

  function handleTypeClick(type: ActivityType) {
    if (activeType === type) {
      // toggle off
      setActiveType(null);
      setDetails(emptyDetails);
    } else {
      setActiveType(type);
      setDetails(emptyDetails);
    }
  }

  function handleSave() {
    if (!activeType) return;
    const label = ACTIVITY_TYPES.find((a) => a.type === activeType)?.label ?? activeType;
    const parsedCost = parseFloat(details.costAmount);
    const costUsd = !isNaN(parsedCost) && parsedCost > 0 ? toUSD(parsedCost, details.costCurrency) : null;
    addActivity({
      description: details.title.trim() || label,
      session_type: activeType,
      focus: details.focus || undefined,
      duration_minutes: parseDurationToMinutes(details.duration) || null,
      cost_usd: costUsd,
    });
    setActiveType(null);
    setDetails(emptyDetails);
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px" }}>
        <p style={labelStyle}>Today's Summary</p>
      </div>

      {/* Existing activities as blocks */}
      {activities.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 20px 12px" }}>
          {activities.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                padding: "12px 14px",
                gap: "12px",
                backgroundColor: "#fff",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ paddingTop: "1px" }}>
                <Icon name={SESSION_TYPE_ICONS[a.session_type ?? ""] ?? "target"} size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                  {a.description}
                </span>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                  {a.duration_minutes != null && (
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {formatMinutes(a.duration_minutes)}
                    </span>
                  )}
                  {a.focus && (
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {a.focus}
                    </span>
                  )}
                  {a.cost_usd != null && (
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {formatUSD(a.cost_usd)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteActivity(a.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "2px", color: "var(--text-secondary)", display: "flex", alignItems: "center", flexShrink: 0,
                }}
                aria-label="Delete activity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Activity type buttons */}
      <div
        style={{
          padding: "10px 20px 14px",
          borderTop: "1px solid rgba(0,0,0,0.04)",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {ACTIVITY_TYPES.map(({ type, label }) => {
          const active = activeType === type;
          return (
            <button
              key={type}
              onClick={() => handleTypeClick(type)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: "13px",
                fontWeight: 500,
                border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.12)",
                backgroundColor: active ? "var(--text-primary)" : "#fff",
                color: active ? "#fff" : "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "inherit",
              }}
            >
              <Icon name={SESSION_TYPE_ICONS[type] ?? "target"} size={14} />
              {label}
              {!active && <span style={{ fontSize: "15px", lineHeight: 1, opacity: 0.5, marginLeft: "2px" }}>+</span>}
            </button>
          );
        })}
      </div>

      {/* Details form for selected type */}
      {activeType && (
        <div
          style={{
            padding: "14px 20px 18px",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "rgba(0,0,0,0.015)",
          }}
        >
          {/* Title */}
          <div>
            <p style={fieldLabelStyle}>Title <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.6 }}>(optional)</span></p>
            <input
              type="text"
              placeholder={ACTIVITY_TYPES.find((a) => a.type === activeType)?.label ?? "Session title..."}
              value={details.title}
              onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Duration */}
          <div>
            <p style={fieldLabelStyle}>Duration</p>
            <select
              value={details.duration}
              onChange={(e) => setDetails((d) => ({ ...d, duration: e.target.value }))}
              style={selectStyle}
            >
              <option value="">Select duration</option>
              {SESSION_DURATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Focus (only relevant for padel sessions) */}
          {(activeType === "coach" || activeType === "drilling" || activeType === "match") && (
            <div>
              <p style={fieldLabelStyle}>Focus</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {SESSION_FOCUSES.map((f) => {
                  const selected = details.focus.split(", ").filter(Boolean);
                  const isActive = selected.includes(f);
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        const next = isActive ? selected.filter((s) => s !== f) : [...selected, f];
                        setDetails((d) => ({ ...d, focus: next.join(", ") }));
                      }}
                      style={{
                        padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 500,
                        border: isActive ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                        backgroundColor: isActive ? "var(--text-primary)" : "#fff",
                        color: isActive ? "#fff" : "var(--text-primary)",
                        cursor: "pointer", transition: "all 0.15s ease",
                        fontFamily: "inherit",
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cost */}
          <div>
            <p style={fieldLabelStyle}>Cost</p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={details.costAmount}
                onChange={(e) => setDetails((d) => ({ ...d, costAmount: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }}
              />
              <select
                value={details.costCurrency}
                onChange={(e) => setDetails((d) => ({ ...d, costCurrency: e.target.value as CurrencyCode }))}
                style={{ ...selectStyle, width: "90px", flex: "none" }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
            {details.costAmount && !isNaN(parseFloat(details.costAmount)) && parseFloat(details.costAmount) > 0 && details.costCurrency !== "USD" && (
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                = {formatUSD(toUSD(parseFloat(details.costAmount), details.costCurrency))} USD
              </p>
            )}
          </div>

          {/* Save / Cancel */}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1, padding: "10px", borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--text-primary)", color: "#fff",
                fontSize: "14px", fontWeight: 600,
                border: "none", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Add {ACTIVITY_TYPES.find((a) => a.type === activeType)?.label}
            </button>
            <button
              onClick={() => { setActiveType(null); setDetails(emptyDetails); }}
              style={{
                padding: "10px 20px", borderRadius: "var(--radius-pill)",
                backgroundColor: "#fff", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500,
                border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

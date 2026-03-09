"use client";

import { useState } from "react";
import type { DailyActivity } from "@/types";

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  fontSize: "13px",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "inherit",
};

export function DayActivitiesSection({
  activities,
  onAdd,
  onDelete,
  onUpdateDuration,
}: {
  activities: DailyActivity[];
  onAdd: (description: string) => void;
  onDelete: (id: string) => void;
  onUpdateDuration: (id: string, minutes: number | null) => void;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const desc = input.trim();
    if (!desc) return;
    onAdd(desc);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div
      style={{
        padding: "10px 16px 12px",
        backgroundColor: "#fafaf5",
        borderRadius: "0 0 var(--radius-md) var(--radius-md)",
        borderTop: "1px dashed rgba(0,0,0,0.06)",
      }}
    >
      {/* Existing activities */}
      {activities.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
          {activities.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
              }}
            >
              <span style={{ flex: 1, color: "var(--text-primary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.description}
              </span>
              <input
                type="number"
                min={0}
                placeholder="min"
                value={a.duration_minutes ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateDuration(a.id, val === "" ? null : parseInt(val, 10));
                }}
                style={{
                  ...inputStyle,
                  width: "64px",
                  textAlign: "right",
                  padding: "4px 6px",
                  fontSize: "12px",
                }}
              />
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>min</span>
              <button
                onClick={() => onDelete(a.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
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

      {/* Add input */}
      <div style={{ display: "flex", gap: "6px" }}>
        <input
          type="text"
          placeholder="Add activity..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ ...inputStyle, flex: 1, fontSize: "12px", padding: "6px 10px" }}
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            fontSize: "12px",
            fontWeight: 600,
            border: "none",
            backgroundColor: input.trim() ? "var(--text-primary)" : "rgba(0,0,0,0.06)",
            color: input.trim() ? "#fff" : "var(--text-secondary)",
            cursor: input.trim() ? "pointer" : "default",
            transition: "all 0.15s ease",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useDay } from "@/hooks/useDay";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useTrainingPlan } from "@/hooks/useTrainingPlan";
import { useActivities } from "@/hooks/useActivities";
import { FEELINGS, SESSION_STATUSES, SESSION_TYPES, SESSION_TYPE_ICONS, SESSION_DURATIONS, SESSION_FOCUSES } from "@/lib/data/constants";
import { Icon, resolveIconName, PencilIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/utils/dates";
import { CURRENCIES, toUSD, formatUSD } from "@/lib/utils/currency";
import { parseDurationToMinutes, formatMinutes } from "@/lib/utils/duration";
import type { CurrencyCode } from "@/lib/utils/currency";
import type { SessionStatus, Feeling } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  completed: "Completed",
  modified: "Modified",
  skipped: "Skipped",
};

const ACTIVITY_TYPES = [
  { type: "coach", label: "Coach Session" },
  { type: "match", label: "Game" },
  { type: "tournament", label: "Tournament" },
  { type: "americano", label: "Americano" },
  { type: "gym", label: "Gym" },
  { type: "drilling", label: "Drilling" },
  { type: "recovery", label: "Recovery" },
] as const;

type ActivityType = typeof ACTIVITY_TYPES[number]["type"];

const emptyDetails = { title: "", duration: "", focus: "", notes: "", costAmount: "", costCurrency: "USD" as CurrencyCode, tournamentLevel: "", tournamentLocation: "", tournamentStage: "", result: "", placement: "" };

const TOURNAMENT_STAGES = ["Groups", "Round of 16", "Quarter Finals", "Semi Finals", "Final", "Consolation"] as const;
const TOURNAMENT_LEVELS = ["Low Bronze", "High Bronze", "High Bronze / Low Silver", "Low Silver", "High Silver", "Low Gold", "High Gold", "Advanced", "Open", "P25", "P100", "P200", "P500", "P1000", "WPT"] as const;
const AMERICANO_PLACEMENTS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"] as const;

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
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: "36px",
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export default function TodayPage() {
  const { dayNum, totalDays, currentPhase, dayOfWeek, dateStr, loading: dayLoading } = useDay();
  const { plan, loading: planLoading } = useTrainingPlan();
  const { log, loading: logLoading, updateLog, saveStatus } = useDailyLog();
  const { activities, loading: activitiesLoading, addActivity, deleteActivity } = useActivities();

  const [editingSession, setEditingSession] = useState(false);
  const [expandedSession, setExpandedSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ type: "", title: "", duration: "", focus: "" });
  const [sessionFocusInput, setSessionFocusInput] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costCurrency, setCostCurrency] = useState<CurrencyCode>("USD");
  const [sessionSaving, setSessionSaving] = useState(false);

  const [activeType, setActiveType] = useState<ActivityType | null>(null);
  const [actDetails, setActDetails] = useState(emptyDetails);
  const [actFocusInput, setActFocusInput] = useState("");

  const loading = dayLoading || planLoading || logLoading || activitiesLoading;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Loading...</p>
      </div>
    );
  }

  if (!plan || !currentPhase) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "12px" }}>
        <p style={{ fontSize: "18px", fontWeight: 500 }}>No training plan found</p>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Complete onboarding to generate your plan.</p>
      </div>
    );
  }

  const todaySession = currentPhase.weekly_schedule[dayOfWeek];
  const hasCustomSession = !!log?.custom_session_title;
  const progressPercent = Math.min(100, Math.round((dayNum / totalDays) * 100));

  function openSessionEdit() {
    if (editingSession) { setEditingSession(false); return; }
    setEditingSession(true);
    setSessionForm({
      type: todaySession?.type ?? "",
      title: hasCustomSession ? (log!.custom_session_title ?? "") : (todaySession?.title ?? ""),
      duration: hasCustomSession ? (log!.custom_session_duration ?? "") : (todaySession?.duration ?? ""),
      focus: hasCustomSession ? (log!.custom_session_focus ?? "") : (todaySession?.focus ?? ""),
    });
    setCostAmount(log?.cost_usd != null ? String(log.cost_usd) : "");
    setCostCurrency("USD");
  }

  async function saveSessionEdit() {
    setSessionSaving(true);
    const parsedCost = parseFloat(costAmount);
    const costUsd = !isNaN(parsedCost) && parsedCost > 0 ? toUSD(parsedCost, costCurrency) : null;
    await updateLog({
      status: "modified" as SessionStatus,
      custom_session_title: sessionForm.title,
      custom_session_duration: sessionForm.duration,
      custom_session_focus: sessionForm.focus,
      cost_usd: costUsd,
    });
    setSessionSaving(false);
    setEditingSession(false);
  }

  function handleTypeClick(type: ActivityType) {
    if (activeType === type) { setActiveType(null); setActDetails(emptyDetails); return; }
    setActiveType(type);
    setActDetails(emptyDetails);
  }

  function handleAddActivity() {
    if (!activeType) return;
    const label = ACTIVITY_TYPES.find((a) => a.type === activeType)?.label ?? activeType;
    const parsedCost = parseFloat(actDetails.costAmount);
    const costUsd = !isNaN(parsedCost) && parsedCost > 0 ? toUSD(parsedCost, actDetails.costCurrency) : null;
    const isTournament = activeType === "tournament";
    const isMatch = activeType === "match";
    const isAmericano = activeType === "americano";
    const comment = isTournament
      ? [actDetails.result, actDetails.tournamentStage, actDetails.tournamentLocation].filter(Boolean).join(" · ") || null
      : isMatch
      ? [actDetails.result, actDetails.notes.trim()].filter(Boolean).join(" · ") || null
      : isAmericano
      ? [actDetails.placement, actDetails.notes.trim()].filter(Boolean).join(" · ") || null
      : (actDetails.notes.trim() || null);
    addActivity({
      description: actDetails.title.trim() || label,
      session_type: activeType,
      focus: isTournament ? (actDetails.tournamentLevel || undefined) : (actDetails.focus || undefined),
      comment,
      duration_minutes: parseDurationToMinutes(actDetails.duration) || null,
      cost_usd: costUsd,
    });
    setActiveType(null);
    setActDetails(emptyDetails);
  }

  return (
    <div>
      {/* A) Day Counter Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "4px" }}>
          <h1
            className="font-[family-name:var(--font-outfit)]"
            style={{ fontSize: "42px", fontWeight: 700, lineHeight: 1 }}
          >
            Day {dayNum}
          </h1>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            of {totalDays}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
            {formatDate(dateStr)}
          </p>
          {saveStatus !== "idle" && (
            <span
              style={{
                fontSize: "11px", fontWeight: 600, padding: "2px 10px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: saveStatus === "saved" ? "rgba(46,160,67,0.12)" : "rgba(0,0,0,0.05)",
                color: saveStatus === "saved" ? "#1a7f37" : "var(--text-secondary)",
                transition: "all 0.2s ease",
              }}
            >
              {saveStatus === "saving" ? "Saving..." : "Saved"}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "6px", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPercent}%`, height: "100%",
                backgroundColor: "var(--text-primary)", borderRadius: "3px", transition: "width 0.3s ease",
              }}
            />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, minWidth: "36px", textAlign: "right" }}>
            {progressPercent}%
          </span>
        </div>

        {/* Phase badge */}
        <div
          style={{
            display: "inline-block", marginTop: "10px", padding: "4px 14px",
            borderRadius: "var(--radius-pill)", backgroundColor: "var(--bg-card-yellow)",
            fontSize: "13px", fontWeight: 600,
          }}
        >
          Phase {currentPhase.number}: {currentPhase.name}
        </div>
      </div>

      {/* B) Today's Summary Card */}
      {todaySession && (
        <div
          style={{
            backgroundColor: "var(--bg-card-yellow)",
            border: "none",
            borderRadius: "var(--radius-md)",
            marginBottom: "16px",
            position: "relative",
          }}
        >
          <div className="pattern-dots" style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px" }} />
          <div style={{ position: "relative", zIndex: 1, padding: "20px 20px 0" }}>
            <p style={{ ...labelStyle, color: "#6d702d", marginBottom: "14px" }}>Today's Summary</p>

            {/* Planned session block */}
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.55)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 14px",
                marginBottom: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Icon name={resolveIconName(todaySession.icon)} size={20} />
                <h2
                  className="font-[family-name:var(--font-outfit)]"
                  style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.2, flex: 1, minWidth: 0 }}
                >
                  {hasCustomSession ? log!.custom_session_title : todaySession.title}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={() => setExpandedSession((v) => !v)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: "2px 6px", display: "flex", alignItems: "center", gap: "3px",
                      color: "#6d702d", opacity: 0.6, fontSize: "12px", fontWeight: 500, fontFamily: "inherit",
                    }}
                  >
                    {expandedSession ? "Less" : "More"}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedSession ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {todaySession.type !== "rest" && (
                    <button
                      onClick={openSessionEdit}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: "2px", display: "flex", alignItems: "center",
                        color: "#6d702d", opacity: 0.5,
                      }}
                      aria-label="Edit session"
                    >
                      <PencilIcon size={14} />
                    </button>
                  )}
                </div>
              </div>

              {expandedSession && !editingSession && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {hasCustomSession ? log!.custom_session_duration : todaySession.duration}
                    </span>
                    {(hasCustomSession ? log!.custom_session_focus : todaySession.focus) && (
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {hasCustomSession ? log!.custom_session_focus : todaySession.focus}
                      </span>
                    )}
                    {log?.cost_usd != null && (
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {formatUSD(log.cost_usd)}
                      </span>
                    )}
                  </div>
                  {log?.notes && (
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.4, fontStyle: "italic" }}>
                      {log.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Inline edit form */}
              {editingSession && (
                <div
                  style={{
                    marginTop: "14px", paddingTop: "14px",
                    borderTop: "1px solid rgba(0,0,0,0.08)",
                    display: "flex", flexDirection: "column", gap: "12px",
                  }}
                >
                  <div>
                    <p style={fieldLabelStyle}>Type</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {SESSION_TYPES.map((t) => {
                        const active = sessionForm.type === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setSessionForm((f) => ({ ...f, type: t }))}
                            style={{
                              display: "flex", alignItems: "center", gap: "4px",
                              padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 500,
                              border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                              backgroundColor: active ? "var(--text-primary)" : "#fff",
                              color: active ? "#fff" : "var(--text-primary)",
                              cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                            }}
                          >
                            <Icon name={SESSION_TYPE_ICONS[t] ?? "target"} size={14} />
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p style={fieldLabelStyle}>Title</p>
                    <input type="text" value={sessionForm.title} onChange={(e) => setSessionForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <p style={fieldLabelStyle}>Duration</p>
                    <select
                      value={sessionForm.duration}
                      onChange={(e) => setSessionForm((f) => ({ ...f, duration: e.target.value }))}
                      style={selectStyle}
                    >
                      <option value="">Select duration</option>
                      {SESSION_DURATIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p style={fieldLabelStyle}>Focus</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                      {(() => {
                        const selected = sessionForm.focus.split(", ").filter(Boolean);
                        return [
                          ...SESSION_FOCUSES.map((f) => {
                            const active = selected.includes(f);
                            return (
                              <button
                                key={f}
                                onClick={() => {
                                  const next = active ? selected.filter((s) => s !== f) : [...selected, f];
                                  setSessionForm((prev) => ({ ...prev, focus: next.join(", ") }));
                                }}
                                style={{
                                  padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 500,
                                  border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                                  backgroundColor: active ? "var(--text-primary)" : "#fff",
                                  color: active ? "#fff" : "var(--text-primary)",
                                  cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                                }}
                              >
                                {f}
                              </button>
                            );
                          }),
                          ...selected.filter((s) => !(SESSION_FOCUSES as readonly string[]).includes(s)).map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                const next = selected.filter((x) => x !== s);
                                setSessionForm((prev) => ({ ...prev, focus: next.join(", ") }));
                              }}
                              style={{
                                padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 500,
                                border: "2px solid var(--text-primary)",
                                backgroundColor: "var(--text-primary)", color: "#fff",
                                cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                              }}
                            >
                              {s} ×
                            </button>
                          )),
                        ];
                      })()}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        placeholder="Add custom focus..."
                        value={sessionFocusInput}
                        onChange={(e) => setSessionFocusInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && sessionFocusInput.trim()) {
                            e.preventDefault();
                            const val = sessionFocusInput.trim();
                            const selected = sessionForm.focus.split(", ").filter(Boolean);
                            if (!selected.includes(val)) {
                              setSessionForm((prev) => ({ ...prev, focus: [...selected, val].join(", ") }));
                            }
                            setSessionFocusInput("");
                          }
                        }}
                        style={{ ...inputStyle, fontSize: "13px", padding: "7px 12px" }}
                      />
                      <button
                        onClick={() => {
                          const val = sessionFocusInput.trim();
                          if (!val) return;
                          const selected = sessionForm.focus.split(", ").filter(Boolean);
                          if (!selected.includes(val)) {
                            setSessionForm((prev) => ({ ...prev, focus: [...selected, val].join(", ") }));
                          }
                          setSessionFocusInput("");
                        }}
                        disabled={!sessionFocusInput.trim()}
                        style={{
                          padding: "7px 14px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600,
                          border: "none", backgroundColor: sessionFocusInput.trim() ? "var(--text-primary)" : "rgba(0,0,0,0.06)",
                          color: sessionFocusInput.trim() ? "#fff" : "var(--text-secondary)",
                          cursor: sessionFocusInput.trim() ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap",
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div>
                    <p style={fieldLabelStyle}>Cost</p>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="number" min={0} step="0.01" placeholder="0.00"
                        value={costAmount} onChange={(e) => setCostAmount(e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <select
                        value={costCurrency}
                        onChange={(e) => setCostCurrency(e.target.value as CurrencyCode)}
                        style={{ ...selectStyle, width: "90px", flex: "none" }}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.code}</option>
                        ))}
                      </select>
                    </div>
                    {costAmount && !isNaN(parseFloat(costAmount)) && parseFloat(costAmount) > 0 && costCurrency !== "USD" && (
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        = {formatUSD(toUSD(parseFloat(costAmount), costCurrency))} USD
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={fieldLabelStyle}>Notes</p>
                    <textarea
                      placeholder="How did the session go? What did you work on?"
                      value={log?.notes ?? ""}
                      onChange={(e) => updateLog({ notes: e.target.value })}
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button
                      onClick={saveSessionEdit}
                      disabled={sessionSaving}
                      style={{
                        flex: 1, padding: "10px", borderRadius: "var(--radius-pill)",
                        backgroundColor: "var(--text-primary)", color: "#fff", fontSize: "14px", fontWeight: 600,
                        border: "none", cursor: sessionSaving ? "wait" : "pointer", opacity: sessionSaving ? 0.6 : 1,
                        fontFamily: "inherit",
                      }}
                    >
                      {sessionSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingSession(false)}
                      style={{
                        padding: "10px 20px", borderRadius: "var(--radius-pill)",
                        backgroundColor: "#fff", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500,
                        border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Extra activity blocks */}
            {activities.map((a) => (
              <div
                key={a.id}
                style={{
                  backgroundColor: "rgba(255,255,255,0.55)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px 14px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{ paddingTop: "2px" }}>
                  <Icon name={SESSION_TYPE_ICONS[a.session_type ?? ""] ?? "target"} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                    {a.description}
                  </span>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                    {a.duration_minutes != null && (
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {formatMinutes(a.duration_minutes)}
                      </span>
                    )}
                    {a.focus && (
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{a.focus}</span>
                    )}
                    {a.cost_usd != null && (
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{formatUSD(a.cost_usd)}</span>
                    )}
                  </div>
                  {a.comment && (
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.4, fontStyle: "italic" }}>
                      {a.comment}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteActivity(a.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "2px", color: "#6d702d", opacity: 0.4,
                    display: "flex", alignItems: "center", flexShrink: 0,
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

          {/* Add activity type buttons */}
          <div style={{ padding: "4px 20px 14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {ACTIVITY_TYPES.map(({ type, label }) => {
              const active = activeType === type;
              return (
                <button
                  key={type}
                  onClick={() => handleTypeClick(type)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "7px 13px", borderRadius: "var(--radius-pill)",
                    fontSize: "13px", fontWeight: 500,
                    border: active ? "2px solid #6d702d" : "1px solid rgba(109,112,45,0.3)",
                    backgroundColor: active ? "#6d702d" : "rgba(255,255,255,0.5)",
                    color: active ? "#fff" : "#6d702d",
                    cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                  }}
                >
                  <Icon name={SESSION_TYPE_ICONS[type] ?? "target"} size={13} />
                  {label}
                  {!active && <span style={{ fontSize: "14px", lineHeight: 1, opacity: 0.6, marginLeft: "1px" }}>+</span>}
                </button>
              );
            })}
          </div>

          {/* Details form for selected activity type */}
          {activeType && (
            <div
              style={{
                margin: "0 20px 20px",
                padding: "14px",
                backgroundColor: "rgba(255,255,255,0.6)",
                borderRadius: "var(--radius-sm)",
                display: "flex", flexDirection: "column", gap: "12px",
              }}
            >
              {activeType !== "tournament" && (
                <div>
                  <p style={fieldLabelStyle}>
                    Title <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.6 }}>(optional)</span>
                  </p>
                  <input
                    type="text"
                    placeholder={ACTIVITY_TYPES.find((a) => a.type === activeType)?.label ?? "Session title..."}
                    value={actDetails.title}
                    onChange={(e) => setActDetails((d) => ({ ...d, title: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              )}
              <div>
                <p style={fieldLabelStyle}>Duration</p>
                <select
                  value={actDetails.duration}
                  onChange={(e) => setActDetails((d) => ({ ...d, duration: e.target.value }))}
                  style={selectStyle}
                >
                  <option value="">Select duration</option>
                  {SESSION_DURATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {(activeType === "coach" || activeType === "drilling" || activeType === "match") && (
                <div>
                  <p style={fieldLabelStyle}>Focus</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {(() => {
                      const selected = actDetails.focus.split(", ").filter(Boolean);
                      return [
                        ...SESSION_FOCUSES.map((f) => {
                          const isActive = selected.includes(f);
                          return (
                            <button
                              key={f}
                              onClick={() => {
                                const next = isActive ? selected.filter((s) => s !== f) : [...selected, f];
                                setActDetails((d) => ({ ...d, focus: next.join(", ") }));
                              }}
                              style={{
                                padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 500,
                                border: isActive ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                                backgroundColor: isActive ? "var(--text-primary)" : "#fff",
                                color: isActive ? "#fff" : "var(--text-primary)",
                                cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                              }}
                            >
                              {f}
                            </button>
                          );
                        }),
                        ...selected.filter((s) => !(SESSION_FOCUSES as readonly string[]).includes(s)).map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              const next = selected.filter((x) => x !== s);
                              setActDetails((d) => ({ ...d, focus: next.join(", ") }));
                            }}
                            style={{
                              padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 500,
                              border: "2px solid var(--text-primary)",
                              backgroundColor: "var(--text-primary)", color: "#fff",
                              cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                            }}
                          >
                            {s} ×
                          </button>
                        )),
                      ];
                    })()}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="Add custom focus..."
                      value={actFocusInput}
                      onChange={(e) => setActFocusInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && actFocusInput.trim()) {
                          e.preventDefault();
                          const val = actFocusInput.trim();
                          const selected = actDetails.focus.split(", ").filter(Boolean);
                          if (!selected.includes(val)) {
                            setActDetails((d) => ({ ...d, focus: [...selected, val].join(", ") }));
                          }
                          setActFocusInput("");
                        }
                      }}
                      style={{ ...inputStyle, fontSize: "13px", padding: "7px 12px" }}
                    />
                    <button
                      onClick={() => {
                        const val = actFocusInput.trim();
                        if (!val) return;
                        const selected = actDetails.focus.split(", ").filter(Boolean);
                        if (!selected.includes(val)) {
                          setActDetails((d) => ({ ...d, focus: [...selected, val].join(", ") }));
                        }
                        setActFocusInput("");
                      }}
                      disabled={!actFocusInput.trim()}
                      style={{
                        padding: "7px 14px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600,
                        border: "none", backgroundColor: actFocusInput.trim() ? "var(--text-primary)" : "rgba(0,0,0,0.06)",
                        color: actFocusInput.trim() ? "#fff" : "var(--text-secondary)",
                        cursor: actFocusInput.trim() ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap",
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
              {/* Win/Loss for match and tournament */}
              {(activeType === "match" || activeType === "tournament") && (
                <div>
                  <p style={fieldLabelStyle}>Result</p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {["Win", "Loss"].map((r) => {
                      const active = actDetails.result === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setActDetails((d) => ({ ...d, result: active ? "" : r }))}
                          style={{
                            padding: "8px 24px", borderRadius: "var(--radius-pill)", fontSize: "14px", fontWeight: 600,
                            border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                            backgroundColor: active ? (r === "Win" ? "#1a7f37" : "#cf222e") : "#fff",
                            color: active ? "#fff" : "var(--text-primary)",
                            cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                          }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Tournament-specific fields */}
              {activeType === "tournament" && (
                <>
                  <div>
                    <p style={fieldLabelStyle}>Tournament Name</p>
                    <input
                      type="text" placeholder="e.g. Copa Padel Madrid"
                      value={actDetails.title}
                      onChange={(e) => setActDetails((d) => ({ ...d, title: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <p style={fieldLabelStyle}>Level</p>
                    <select
                      value={actDetails.tournamentLevel}
                      onChange={(e) => setActDetails((d) => ({ ...d, tournamentLevel: e.target.value }))}
                      style={selectStyle}
                    >
                      <option value="">Select level</option>
                      {TOURNAMENT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={fieldLabelStyle}>Location</p>
                    <input
                      type="text" placeholder="e.g. Madrid, Spain"
                      value={actDetails.tournamentLocation}
                      onChange={(e) => setActDetails((d) => ({ ...d, tournamentLocation: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <p style={fieldLabelStyle}>Stage</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {TOURNAMENT_STAGES.map((stage) => {
                        const active = actDetails.tournamentStage === stage;
                        return (
                          <button
                            key={stage}
                            onClick={() => setActDetails((d) => ({ ...d, tournamentStage: active ? "" : stage }))}
                            style={{
                              padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 500,
                              border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                              backgroundColor: active ? "var(--text-primary)" : "#fff",
                              color: active ? "#fff" : "var(--text-primary)",
                              cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                            }}
                          >
                            {stage}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {/* Americano-specific fields */}
              {activeType === "americano" && (
                <div>
                  <p style={fieldLabelStyle}>Place</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {AMERICANO_PLACEMENTS.map((p) => {
                      const active = actDetails.placement === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setActDetails((d) => ({ ...d, placement: active ? "" : p }))}
                          style={{
                            padding: "6px 14px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 600,
                            border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                            backgroundColor: active ? "var(--text-primary)" : "#fff",
                            color: active ? "#fff" : "var(--text-primary)",
                            cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <p style={fieldLabelStyle}>Notes</p>
                <textarea
                  placeholder="e.g. Focused on hitting the ball in front of me always"
                  value={actDetails.notes}
                  onChange={(e) => setActDetails((d) => ({ ...d, notes: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <div>
                <p style={fieldLabelStyle}>Cost</p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="number" min={0} step="0.01" placeholder="0.00"
                    value={actDetails.costAmount}
                    onChange={(e) => setActDetails((d) => ({ ...d, costAmount: e.target.value }))}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <select
                    value={actDetails.costCurrency}
                    onChange={(e) => setActDetails((d) => ({ ...d, costCurrency: e.target.value as CurrencyCode }))}
                    style={{ ...selectStyle, width: "90px", flex: "none" }}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
                {actDetails.costAmount && !isNaN(parseFloat(actDetails.costAmount)) && parseFloat(actDetails.costAmount) > 0 && actDetails.costCurrency !== "USD" && (
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    = {formatUSD(toUSD(parseFloat(actDetails.costAmount), actDetails.costCurrency))} USD
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleAddActivity}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "var(--radius-pill)",
                    backgroundColor: "#6d702d", color: "#fff", fontSize: "14px", fontWeight: 600,
                    border: "none", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Add {ACTIVITY_TYPES.find((a) => a.type === activeType)?.label}
                </button>
                <button
                  onClick={() => { setActiveType(null); setActDetails(emptyDetails); }}
                  style={{
                    padding: "10px 20px", borderRadius: "var(--radius-pill)",
                    backgroundColor: "rgba(255,255,255,0.7)", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500,
                    border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* C) Session Status */}
      <div style={cardStyle}>
        <p style={labelStyle}>Session Status</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {SESSION_STATUSES.map((status) => {
            const active = log?.status === status;
            return (
              <button
                key={status}
                onClick={() => updateLog({ status: status as SessionStatus })}
                style={{
                  flex: 1, minWidth: "70px", padding: "10px 8px",
                  borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600,
                  border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.08)",
                  backgroundColor: active ? "var(--text-primary)" : "#fff",
                  color: active ? "#fff" : "var(--text-primary)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                {STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* D) Feeling Check */}
      <div style={cardStyle}>
        <p style={labelStyle}>How are you feeling?</p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
          {FEELINGS.map((f) => {
            const active = log?.feeling === f.value;
            return (
              <button
                key={f.value}
                onClick={() => updateLog({ feeling: f.value as Feeling })}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  padding: "10px 4px", borderRadius: "var(--radius-sm)",
                  border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.08)",
                  backgroundColor: active ? "rgba(26,26,26,0.06)" : "#fff",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                <Icon name={f.icon} size={22} />
                <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)" }}>
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>

        {log?.feeling === "pain" && (
          <div
            style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(255, 159, 105, 0.15)", border: "1px solid rgba(255, 159, 105, 0.3)",
              fontSize: "13px", lineHeight: 1.5, color: "var(--text-primary)",
            }}
          >
            <strong>15-minute rule:</strong> Warm up for 15 minutes. If you feel better, continue at reduced intensity. If the same or worse, stop immediately. Consider switching to swimming or complete rest today.
          </div>
        )}
        {log?.feeling === "tired" && (
          <div
            style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(235, 245, 95, 0.3)", border: "1px solid rgba(235, 245, 95, 0.5)",
              fontSize: "13px", lineHeight: 1.5, color: "var(--text-primary)",
            }}
          >
            <strong>Drop to 70%.</strong> Focus on technique, not power. Slow everything down and prioritize clean reps over intensity. Your body is recovering — work with it.
          </div>
        )}
      </div>

      {/* E) Process Goals */}
      <div style={cardStyle}>
        <p style={labelStyle}>Process Goals</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text"
            placeholder="Technical focus #1 (e.g. Stay low on every volley)"
            value={log?.process_goal_1 ?? ""}
            onChange={(e) => updateLog({ process_goal_1: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Technical focus #2 (e.g. Pre-grip before defense)"
            value={log?.process_goal_2 ?? ""}
            onChange={(e) => updateLog({ process_goal_2: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

    </div>
  );
}

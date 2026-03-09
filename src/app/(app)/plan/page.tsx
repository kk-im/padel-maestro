"use client";

import { useState, useEffect, useMemo } from "react";
import { useTrainingPlan } from "@/hooks/useTrainingPlan";
import { useDay } from "@/hooks/useDay";
import { useProfile } from "@/hooks/useProfile";
import { useDateRangeLogs } from "@/hooks/useDateRangeLogs";
import { useDateRangeActivities } from "@/hooks/useDateRangeActivities";
import {
  getWeekStart,
  addDays,
  getDayNumForDate,
  getCurrentPhase,
  getDateStr,
} from "@/lib/utils/dates";
import { parseDurationToMinutes, formatMinutes } from "@/lib/utils/duration";
import type { Phase, SessionTemplate } from "@/types";
import {
  Icon,
  resolveIconName,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/ui/Icons";
import { SESSION_TYPES, SESSION_TYPE_ICONS, SESSION_DURATIONS, SESSION_FOCUSES } from "@/lib/data/constants";
import { CURRENCIES, toUSD, formatUSD } from "@/lib/utils/currency";
import type { CurrencyCode } from "@/lib/utils/currency";

const ACTIVITY_TYPES = [
  { type: "coach", label: "Coach Session" },
  { type: "match", label: "Game" },
  { type: "gym", label: "Gym" },
  { type: "drilling", label: "Drilling" },
  { type: "recovery", label: "Recovery" },
] as const;
type ActivityType = typeof ACTIVITY_TYPES[number]["type"];
const emptyActDetails = { title: "", duration: "", focus: "", notes: "", costAmount: "", costCurrency: "USD" as CurrencyCode };

type ViewMode = "overview" | "template" | "dayByDay";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_ABBREVS_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function getDayAbbrev(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return DAY_ABBREVS_FULL[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

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
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  fontSize: "14px",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "inherit",
};

export default function PlanPage() {
  const { plan, loading: planLoading, saving, updateSession } = useTrainingPlan();
  const { currentPhase, dayOfWeek, dayNum, totalDays, startDate, loading: dayLoading } = useDay();
  const { profile } = useProfile();
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ type: "", title: "", duration: "", focus: "" });
  const [viewMode, setViewMode] = useState<ViewMode>("template");
  const [showSchedule, setShowSchedule] = useState(false);

  // Per-day activity adding
  const [editingActKey, setEditingActKey] = useState<string | null>(null); // "date:type"
  const [actDetails, setActDetails] = useState(emptyActDetails);

  // Week navigation for day-by-day view
  const today = getDateStr();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));

  const weekEnd = addDays(weekStart, 6);
  const { logs, loading: logsLoading } = useDateRangeLogs(weekStart, weekEnd);
  const { activities: weekActivities, loading: activitiesLoading, addActivity, deleteActivity, updateDuration } = useDateRangeActivities(weekStart, weekEnd);

  // Default to current phase once loaded
  useEffect(() => {
    if (currentPhase && !selectedPhase) {
      setSelectedPhase(currentPhase);
    }
  }, [currentPhase, selectedPhase]);

  const loading = planLoading || dayLoading;

  // Challenge boundaries
  const challengeEnd = useMemo(() => {
    if (!startDate || !totalDays) return "";
    return addDays(startDate, totalDays - 1);
  }, [startDate, totalDays]);

  // Build week days array for day-by-day
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Completion stats for the visible week
  const completionStats = useMemo(() => {
    if (!plan || !startDate) return { completed: 0, total: 0 };

    let total = 0;
    let completed = 0;

    for (const dateStr of weekDays) {
      const dn = getDayNumForDate(startDate, dateStr);
      if (dn < 1 || dn > totalDays) continue;

      const dayAbbrev = getDayAbbrev(dateStr);
      const phase = getCurrentPhase(dn, plan.phases);
      const session = phase?.weekly_schedule[dayAbbrev];
      if (!session || session.type === "rest") continue;

      total++;
      const log = logs.get(dateStr);
      if (log?.status === "completed" || log?.status === "modified") {
        completed++;
      }
    }

    return { completed, total };
  }, [weekDays, logs, plan, startDate, totalDays]);

  const completionPercent = completionStats.total > 0
    ? Math.round((completionStats.completed / completionStats.total) * 100)
    : 0;

  // Weekly hours: planned vs actual
  const weeklyHours = useMemo(() => {
    if (!plan || !startDate) return { planned: 0, actual: 0 };

    let plannedMinutes = 0;
    let actualMinutes = 0;

    for (const dateStr of weekDays) {
      const dn = getDayNumForDate(startDate, dateStr);
      if (dn < 1 || dn > totalDays) continue;

      const dayAbbrev = getDayAbbrev(dateStr);
      const phase = getCurrentPhase(dn, plan.phases);
      const session = phase?.weekly_schedule[dayAbbrev];
      if (session && session.type !== "rest") {
        plannedMinutes += parseDurationToMinutes(session.duration);
      }

      // Count completed/modified planned session duration
      const log = logs.get(dateStr);
      if ((log?.status === "completed" || log?.status === "modified") && session && session.type !== "rest") {
        const dur = log.custom_session_duration || session.duration;
        actualMinutes += parseDurationToMinutes(dur);
      }

      // Sum extra activity durations for this day
      const dayActivities = weekActivities.get(dateStr) ?? [];
      for (const act of dayActivities) {
        actualMinutes += act.duration_minutes ?? 0;
      }
    }

    return { planned: plannedMinutes, actual: actualMinutes };
  }, [weekDays, plan, startDate, totalDays, weekActivities, logs]);

  const surplusMinutes = weeklyHours.actual - weeklyHours.planned;

  // Days remaining in challenge
  const daysLeft = useMemo(() => {
    if (!dayNum || !totalDays) return null;
    const remaining = totalDays - dayNum;
    return remaining >= 0 ? remaining : 0;
  }, [dayNum, totalDays]);

  // Navigation bounds
  const canGoPrev = startDate && weekStart > getWeekStart(startDate);
  const canGoNext = challengeEnd && addDays(weekStart, 7) <= addDays(getWeekStart(challengeEnd), 7);

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

  // --- Template view helpers ---

  const phase = selectedPhase ?? plan.phases[0];
  const isCurrentPhase = currentPhase?.number === phase.number;

  function openEdit(day: string, session: SessionTemplate) {
    if (editingDay === day) {
      setEditingDay(null);
      return;
    }
    setEditingDay(day);
    setEditForm({
      type: session.type,
      title: session.title,
      duration: session.duration,
      focus: session.focus,
    });
  }

  async function handleSave() {
    if (!editingDay || !phase) return;
    await updateSession(phase.number, editingDay, {
      type: editForm.type as SessionTemplate["type"],
      title: editForm.title,
      duration: editForm.duration,
      focus: editForm.focus,
      icon: SESSION_TYPE_ICONS[editForm.type] ?? "target",
    });
    setEditingDay(null);
  }

  function handlePhaseChange(p: Phase) {
    setSelectedPhase(p);
    setEditingDay(null);
  }

  // --- Render ---

  return (
    <div>
      {/* Header */}
      <h1
        className="font-[family-name:var(--font-outfit)]"
        style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px" }}
      >
        Training Plan
      </h1>

      {/* View Mode Toggle */}
      <div
        style={{
          display: "inline-flex",
          borderRadius: "var(--radius-pill)",
          border: "1px solid rgba(0,0,0,0.1)",
          overflow: "hidden",
          marginBottom: "20px",
        }}
      >
        {(["overview", "template", "dayByDay"] as const).map((mode) => {
          const active = viewMode === mode;
          const label = mode === "overview" ? "Overview" : mode === "template" ? "Template" : "Day by Day";
          return (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                setEditingDay(null);
              }}
              style={{
                padding: "8px 20px",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                backgroundColor: active ? "var(--text-primary)" : "transparent",
                color: active ? "#fff" : "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ========== DAY BY DAY VIEW ========== */}
      {viewMode === "dayByDay" && (
        <div>
          {/* Completion bar + days left */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
              <p style={{ fontSize: "15px", fontWeight: 600 }}>
                {completionStats.completed} of {completionStats.total} sessions completed
              </p>
              <span style={{ fontSize: "14px", fontWeight: 700 }}>{completionPercent}%</span>
            </div>
            <div
              style={{
                height: "6px",
                backgroundColor: "rgba(0,0,0,0.06)",
                borderRadius: "3px",
                overflow: "hidden",
                marginBottom: daysLeft !== null ? "10px" : 0,
              }}
            >
              <div
                style={{
                  width: `${completionPercent}%`,
                  height: "100%",
                  backgroundColor: "var(--text-primary)",
                  borderRadius: "3px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            {daysLeft !== null && (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                {daysLeft} {daysLeft === 1 ? "day" : "days"} left
              </p>
            )}
          </div>

          {/* Weekly Hours Summary */}
          <div style={cardStyle}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Weekly Hours
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>
                {formatMinutes(weeklyHours.actual)}
              </span>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                / {formatMinutes(weeklyHours.planned)} planned
              </span>
            </div>
            {/* Progress bar */}
            <div
              style={{
                height: "6px",
                backgroundColor: "rgba(0,0,0,0.06)",
                borderRadius: "3px",
                overflow: "hidden",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: `${weeklyHours.planned > 0 ? Math.min(100, Math.round((weeklyHours.actual / weeklyHours.planned) * 100)) : 0}%`,
                  height: "100%",
                  backgroundColor: surplusMinutes >= 0 ? "#1a7f37" : "#cf222e",
                  borderRadius: "3px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            {/* Surplus/deficit message */}
            {weeklyHours.planned > 0 && (
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: surplusMinutes >= 0 ? "#1a7f37" : "#cf222e",
                }}
              >
                {surplusMinutes >= 0
                  ? `+${formatMinutes(surplusMinutes)} ahead of plan`
                  : `${formatMinutes(Math.abs(surplusMinutes))} behind plan`}
              </p>
            )}
          </div>

          {/* Week navigator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <button
              onClick={() => canGoPrev && setWeekStart(addDays(weekStart, -7))}
              disabled={!canGoPrev}
              style={{
                padding: "8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(0,0,0,0.08)",
                backgroundColor: "#fff",
                cursor: canGoPrev ? "pointer" : "default",
                opacity: canGoPrev ? 1 : 0.3,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeftIcon size={20} />
            </button>

            <span style={{ fontSize: "15px", fontWeight: 600 }}>
              {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
            </span>

            <button
              onClick={() => canGoNext && setWeekStart(addDays(weekStart, 7))}
              disabled={!canGoNext}
              style={{
                padding: "8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(0,0,0,0.08)",
                backgroundColor: "#fff",
                cursor: canGoNext ? "pointer" : "default",
                opacity: canGoNext ? 1 : 0.3,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>

          {/* Day cards */}
          {(logsLoading || activitiesLoading) ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "20px" }}>
              Loading...
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              {weekDays.map((dateStr) => {
                const dn = getDayNumForDate(startDate, dateStr);
                const outOfRange = dn < 1 || dn > totalDays;
                const isToday = dateStr === today;
                const isFuture = dateStr > today;
                const dayAbbrev = getDayAbbrev(dateStr);
                const dayPhase = outOfRange ? null : getCurrentPhase(dn, plan.phases);
                const session = dayPhase?.weekly_schedule[dayAbbrev] ?? null;
                const log = logs.get(dateStr);
                const hasCustom = !!log?.custom_session_title;
                const dayActivities = weekActivities.get(dateStr) ?? [];

                // Status indicator
                let statusColor = "";
                let statusLabel = "";
                if (log?.status === "completed") {
                  statusColor = "#1a7f37";
                  statusLabel = "Done";
                } else if (log?.status === "modified") {
                  statusColor = "#9a6700";
                  statusLabel = "Modified";
                } else if (log?.status === "skipped") {
                  statusColor = "#cf222e";
                  statusLabel = "Skipped";
                }

                return (
                  <div
                    key={dateStr}
                    style={{
                      borderRadius: "var(--radius-md)",
                      border: isToday
                        ? "2px solid rgba(0,0,0,0.1)"
                        : "1px solid rgba(0,0,0,0.06)",
                      overflow: "hidden",
                      opacity: outOfRange ? 0.4 : isFuture ? 0.7 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Day header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 16px",
                        backgroundColor: isToday ? "var(--bg-card-yellow)" : "rgba(0,0,0,0.02)",
                        borderBottom: "1px solid rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700 }}>{dayAbbrev}</span>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          {formatShortDate(dateStr)}
                          {!outOfRange && <> &middot; Day {dn}</>}
                        </span>
                      </div>
                      {isToday && (
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: "rgba(0,0,0,0.06)",
                        }}>
                          Today
                        </span>
                      )}
                    </div>

                    {/* Items list */}
                    <div style={{ backgroundColor: "#fff" }}>
                      {/* Logged activities */}
                      {dayActivities.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            display: "flex", alignItems: "flex-start",
                            padding: "10px 16px", gap: "10px",
                            borderBottom: "1px solid rgba(0,0,0,0.04)",
                          }}
                        >
                          <div style={{ paddingTop: "2px" }}>
                            <Icon name={SESSION_TYPE_ICONS[a.session_type ?? ""] ?? "target"} size={16} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>{a.description}</span>
                            <div style={{ display: "flex", gap: "8px", marginTop: "2px", flexWrap: "wrap" }}>
                              {a.duration_minutes != null && (
                                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{formatMinutes(a.duration_minutes)}</span>
                              )}
                              {a.focus && <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{a.focus}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteActivity(dateStr, a.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "var(--text-secondary)", display: "flex", alignItems: "center", flexShrink: 0 }}
                            aria-label="Delete"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Activity type buttons + form */}
                      {!outOfRange && (() => {
                        const openKey = editingActKey?.startsWith(dateStr + ":") ? editingActKey.split(":")[1] as ActivityType : null;
                        return (
                          <div style={{ borderTop: dayActivities.length > 0 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                            {/* Type buttons */}
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", padding: "8px 16px 8px" }}>
                              {ACTIVITY_TYPES.map(({ type, label }) => {
                                const active = openKey === type;
                                return (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      const key = `${dateStr}:${type}`;
                                      if (editingActKey === key) {
                                        setEditingActKey(null);
                                        setActDetails(emptyActDetails);
                                      } else {
                                        setEditingActKey(key);
                                        setActDetails(emptyActDetails);
                                      }
                                    }}
                                    style={{
                                      display: "flex", alignItems: "center", gap: "5px",
                                      padding: "5px 10px", borderRadius: "var(--radius-pill)",
                                      fontSize: "12px", fontWeight: 500,
                                      border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                                      backgroundColor: active ? "var(--text-primary)" : "#fff",
                                      color: active ? "#fff" : "var(--text-primary)",
                                      cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                                    }}
                                  >
                                    <Icon name={SESSION_TYPE_ICONS[type] ?? "target"} size={12} />
                                    {label}
                                    {!active && <span style={{ fontSize: "13px", opacity: 0.5, marginLeft: "1px" }}>+</span>}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Details form */}
                            {openKey && (
                              <div style={{
                                padding: "12px 16px 16px",
                                borderTop: "1px solid rgba(0,0,0,0.06)",
                                backgroundColor: "rgba(0,0,0,0.015)",
                                display: "flex", flexDirection: "column", gap: "10px",
                              }}>
                                {/* Duration */}
                                <div>
                                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Duration</p>
                                  <select
                                    value={actDetails.duration}
                                    onChange={(e) => setActDetails((d) => ({ ...d, duration: e.target.value }))}
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit", appearance: "none" }}
                                  >
                                    <option value="">Select duration</option>
                                    {SESSION_DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>

                                {/* Focus */}
                                {(openKey === "coach" || openKey === "drilling" || openKey === "match") && (
                                  <div>
                                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Focus</p>
                                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                      {SESSION_FOCUSES.map((f) => {
                                        const sel = actDetails.focus.split(", ").filter(Boolean);
                                        const isActive = sel.includes(f);
                                        return (
                                          <button key={f} onClick={() => {
                                            const next = isActive ? sel.filter((s) => s !== f) : [...sel, f];
                                            setActDetails((d) => ({ ...d, focus: next.join(", ") }));
                                          }} style={{
                                            padding: "4px 10px", borderRadius: "var(--radius-pill)", fontSize: "12px", fontWeight: 500,
                                            border: isActive ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                                            backgroundColor: isActive ? "var(--text-primary)" : "#fff",
                                            color: isActive ? "#fff" : "var(--text-primary)",
                                            cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                                          }}>{f}</button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Save / Cancel */}
                                <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                                  <button
                                    onClick={() => {
                                      const label = ACTIVITY_TYPES.find((a) => a.type === openKey)?.label ?? openKey;
                                      addActivity(dateStr, {
                                        description: actDetails.title.trim() || label,
                                        session_type: openKey,
                                        focus: actDetails.focus || undefined,
                                        duration_minutes: parseDurationToMinutes(actDetails.duration) || null,
                                      });
                                      setEditingActKey(null);
                                      setActDetails(emptyActDetails);
                                    }}
                                    style={{
                                      flex: 1, padding: "8px", borderRadius: "var(--radius-pill)",
                                      backgroundColor: "var(--text-primary)", color: "#fff",
                                      fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit",
                                    }}
                                  >
                                    Add {ACTIVITY_TYPES.find((a) => a.type === openKey)?.label}
                                  </button>
                                  <button
                                    onClick={() => { setEditingActKey(null); setActDetails(emptyActDetails); }}
                                    style={{
                                      padding: "8px 16px", borderRadius: "var(--radius-pill)",
                                      backgroundColor: "#fff", color: "var(--text-secondary)",
                                      fontSize: "13px", fontWeight: 500,
                                      border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", fontFamily: "inherit",
                                    }}
                                  >Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========== OVERVIEW ========== */}
      {viewMode === "overview" && (
        <div>
          {/* Goal */}
          {(profile?.goals || profile?.target_level) && (
            <div style={{ ...cardStyle, background: "var(--bg-card-yellow)", border: "1px solid rgba(0,0,0,0.08)" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "8px" }}>End Goal</p>
              {profile?.goals && (
                <p style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.4, marginBottom: profile?.target_level ? "8px" : 0 }}>
                  {profile.goals}
                </p>
              )}
              {profile?.target_level && (
                <span style={{
                  display: "inline-block", padding: "3px 10px",
                  borderRadius: "var(--radius-pill)", backgroundColor: "rgba(0,0,0,0.08)",
                  fontSize: "12px", fontWeight: 600,
                }}>
                  Target: {profile.target_level}
                </span>
              )}
            </div>
          )}

          {/* Starting point */}
          <div style={cardStyle}>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>Where You Started</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {profile?.playing_level && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Current level</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{profile.playing_level}</span>
                </div>
              )}
              {profile?.playing_frequency && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Plays</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{profile.playing_frequency}</span>
                </div>
              )}
              {profile?.coaching_frequency && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Coaching</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{profile.coaching_frequency}</span>
                </div>
              )}
              {profile?.racket_sport_background && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Background</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{profile.racket_sport_background}</span>
                </div>
              )}
              {profile?.dominant_hand && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Dominant hand</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{profile.dominant_hand}</span>
                </div>
              )}
              {profile?.preferred_side && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Preferred side</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{profile.preferred_side}</span>
                </div>
              )}
              {profile?.injuries_or_limitations && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Limitations</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{profile.injuries_or_limitations}</span>
                </div>
              )}
            </div>
          </div>

          {/* Phase journey */}
          <div style={cardStyle}>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "16px" }}>
              The {totalDays}-Day Journey
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {plan.phases.map((p, i) => {
                const isLast = i === plan.phases.length - 1;
                const phaseLen = p.end_day - p.start_day + 1;
                const isCurrent = currentPhase?.number === p.number;
                return (
                  <div key={p.number} style={{ display: "flex", gap: "16px" }}>
                    {/* Timeline spine */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "24px", flexShrink: 0 }}>
                      <div style={{
                        width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0,
                        backgroundColor: isCurrent ? "var(--text-primary)" : "rgba(0,0,0,0.15)",
                        border: isCurrent ? "none" : "2px solid rgba(0,0,0,0.15)",
                        marginTop: "4px",
                      }} />
                      {!isLast && <div style={{ width: "2px", flex: 1, backgroundColor: "rgba(0,0,0,0.08)", minHeight: "24px", marginTop: "4px", marginBottom: "4px" }} />}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, paddingBottom: isLast ? 0 : "20px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                        <p style={{ fontSize: "15px", fontWeight: 700 }}>{p.name}</p>
                        {isCurrent && (
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "var(--radius-pill)", backgroundColor: "var(--text-primary)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Now
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                        Days {p.start_day}–{p.end_day} · {phaseLen} days
                      </p>
                      <p style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--text-primary)", marginBottom: "8px" }}>
                        {p.description}
                      </p>
                      {p.technical_priorities && p.technical_priorities.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {p.technical_priorities.slice(0, 3).map((pri) => (
                            <div key={pri} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.3)", flexShrink: 0 }} />
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{pri}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final milestone */}
          {plan.phases.length > 0 && (
            <div style={cardStyle}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>
                Where You&apos;ll Be by Day {totalDays}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>On court</p>
                  <p style={{ fontSize: "14px", lineHeight: 1.4 }}>{plan.phases[plan.phases.length - 1].milestones.technical}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Physically</p>
                  <p style={{ fontSize: "14px", lineHeight: 1.4 }}>{plan.phases[plan.phases.length - 1].milestones.physical}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== TEMPLATE VIEW ========== */}
      {viewMode === "template" && (
        <div>
          {/* 1) Phase Selector */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto" }}>
            {plan.phases.map((p) => {
              const active = phase.number === p.number;
              return (
                <button
                  key={p.number}
                  onClick={() => handlePhaseChange(p)}
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
                  Phase {p.number}
                </button>
              );
            })}
          </div>

          {/* 2) Phase Info */}
          <div style={cardStyle}>
            <h2
              className="font-[family-name:var(--font-outfit)]"
              style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}
            >
              {phase.name}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
              {phase.description}
            </p>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "rgba(0,0,0,0.05)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Days {phase.start_day}–{phase.end_day}
            </span>
          </div>

          {/* 3) Session list (collapsible) */}
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={() => setShowSchedule((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "var(--radius-pill)",
                fontSize: "13px", fontWeight: 500,
                border: showSchedule ? "1.5px solid rgba(0,0,0,0.2)" : "1px solid rgba(0,0,0,0.12)",
                backgroundColor: showSchedule ? "rgba(0,0,0,0.06)" : "#fff",
                color: "var(--text-secondary)", cursor: "pointer",
                transition: "all 0.15s ease", fontFamily: "inherit",
                marginBottom: showSchedule ? "12px" : 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              {showSchedule ? "Hide plan" : "See plan"}
            </button>

            {showSchedule && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {DAYS.map((day) => {
                  const session = phase.weekly_schedule[day];
                  if (!session || session.type === "rest") return null;
                  const isEditing = editingDay === day;
                  return (
                    <div key={day}>
                      <div
                        onClick={() => openEdit(day, session)}
                        style={{
                          display: "flex", alignItems: "center",
                          padding: "12px 16px",
                          borderRadius: isEditing ? "var(--radius-md) var(--radius-md) 0 0" : "var(--radius-md)",
                          backgroundColor: "#fff",
                          border: "1px solid rgba(0,0,0,0.06)",
                          gap: "12px", cursor: "pointer", transition: "all 0.15s ease",
                        }}
                      >
                        <Icon name={resolveIconName(session.icon)} size={20} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>{session.title}</p>
                          {session.focus && (
                            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {session.focus}
                            </p>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                            {session.duration}
                          </span>
                          <PencilIcon size={14} style={{ color: "var(--text-secondary)", opacity: 0.5 }} />
                        </div>
                      </div>

                      {isEditing && (
                        <div style={{
                          padding: "16px", backgroundColor: "#fafaf5",
                          borderRadius: "0 0 var(--radius-md) var(--radius-md)",
                          border: "1px solid rgba(0,0,0,0.06)", borderTop: "none",
                          display: "flex", flexDirection: "column", gap: "12px",
                        }}>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Type</p>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {SESSION_TYPES.map((t) => {
                                const active = editForm.type === t;
                                return (
                                  <button key={t} onClick={() => setEditForm((f) => ({ ...f, type: t }))} style={{
                                    display: "flex", alignItems: "center", gap: "4px",
                                    padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: 500,
                                    border: active ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                                    backgroundColor: active ? "var(--text-primary)" : "#fff",
                                    color: active ? "#fff" : "var(--text-primary)",
                                    cursor: "pointer", transition: "all 0.15s ease",
                                  }}>
                                    <Icon name={SESSION_TYPE_ICONS[t] ?? "target"} size={14} />{t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Title</p>
                            <input type="text" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Duration</p>
                            <input type="text" value={editForm.duration} onChange={(e) => setEditForm((f) => ({ ...f, duration: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Focus</p>
                            <input type="text" value={editForm.focus} onChange={(e) => setEditForm((f) => ({ ...f, focus: e.target.value }))} style={inputStyle} />
                          </div>
                          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            <button onClick={handleSave} disabled={saving} style={{
                              flex: 1, padding: "10px", borderRadius: "var(--radius-pill)",
                              backgroundColor: "var(--text-primary)", color: "#fff", fontSize: "14px", fontWeight: 600,
                              border: "none", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1,
                            }}>{saving ? "Saving..." : "Save"}</button>
                            <button onClick={() => setEditingDay(null)} style={{
                              padding: "10px 20px", borderRadius: "var(--radius-pill)",
                              backgroundColor: "#fff", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500,
                              border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer",
                            }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4) Phase Milestones */}
          <div style={cardStyle}>
            <p style={labelStyle}>Milestones</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "#fff",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  Technical
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.4 }}>{phase.milestones.technical}</p>
              </div>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "#fff",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  Physical
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.4 }}>{phase.milestones.physical}</p>
              </div>
            </div>
          </div>

          {/* 5) Technical Priorities */}
          <div style={cardStyle}>
            <p style={labelStyle}>Technical Priorities</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {phase.technical_priorities.map((priority, i) => (
                <span
                  key={i}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--bg-card-yellow)",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {priority}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

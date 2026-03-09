import type { Phase } from "@/types";

const DAY_ABBREVS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Returns the current day of the challenge based on the user's start date.
 * Day 1 = start_date. Minimum return value is 1.
 */
export function getDay(startDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Returns the phase where dayNum falls between start_day and end_day,
 * or null if no phase matches.
 */
export function getCurrentPhase(dayNum: number, phases: Phase[]): Phase | null {
  return phases.find((p) => dayNum >= p.start_day && dayNum <= p.end_day) ?? null;
}

/**
 * Returns today's day abbreviation: "Mon", "Tue", "Wed", etc.
 */
export function getDayOfWeek(): string {
  return DAY_ABBREVS[new Date().getDay()];
}

/**
 * Returns today's date as "YYYY-MM-DD".
 */
export function getDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Formats "YYYY-MM-DD" as "Monday, March 2" style.
 */
export function formatDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generates month labels from start date through challenge duration.
 * Returns ["Baseline", "March", "April", ...] based on actual calendar months covered.
 */
/**
 * Returns the Monday (YYYY-MM-DD) of the week containing the given date.
 */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

/**
 * Returns "YYYY-MM-DD" offset by N days (positive or negative).
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/**
 * Returns the 1-based challenge day number for any calendar date.
 */
export function getDayNumForDate(startDate: string, dateStr: string): number {
  const start = new Date(startDate + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  const diffMs = target.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Returns the "YYYY-MM-DD" calendar date for a given 1-based day number.
 */
export function getDateForDayNum(startDate: string, dayNum: number): string {
  return addDays(startDate, dayNum - 1);
}

/** Internal helper to format a Date as "YYYY-MM-DD". */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Generates month labels from start date through challenge duration.
 * Returns ["Baseline", "March", "April", ...] based on actual calendar months covered.
 */
export function getMonthLabels(startDate: string, durationDays: number): string[] {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const labels: string[] = ["Baseline"];

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    labels.push(MONTH_NAMES[cursor.getMonth()]);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return labels;
}

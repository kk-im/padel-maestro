/**
 * Parse a human-readable duration string to minutes.
 * Handles: "60 min", "1.5 hrs", "1h30m", "90", "1.5 hours", "2h", etc.
 * Returns 0 if unparseable.
 */
export function parseDurationToMinutes(str: string | null | undefined): number {
  if (!str) return 0;
  const s = str.trim().toLowerCase();
  if (!s) return 0;

  // "1h30m" or "1h 30m"
  const hm = s.match(/^(\d+(?:\.\d+)?)\s*h(?:rs?|ours?)?\s*(\d+)\s*m/);
  if (hm) return Math.round(parseFloat(hm[1]) * 60 + parseFloat(hm[2]));

  // "1.5 hrs", "2 hours", "1h"
  const hrs = s.match(/^(\d+(?:\.\d+)?)\s*h(?:rs?|ours?)?$/);
  if (hrs) return Math.round(parseFloat(hrs[1]) * 60);

  // "60 min", "90 mins", "45 minutes"
  const mins = s.match(/^(\d+(?:\.\d+)?)\s*m(?:ins?|inutes?)?$/);
  if (mins) return Math.round(parseFloat(mins[1]));

  // Plain number — treat as minutes
  const plain = parseFloat(s);
  if (!isNaN(plain) && plain >= 0) return Math.round(plain);

  return 0;
}

/**
 * Format minutes into a human-readable string.
 * 90 → "1.5 hrs", 45 → "45 min", 0 → "0 min"
 */
export function formatMinutes(mins: number): string {
  if (mins <= 0) return "0 min";
  if (mins < 60) return `${mins} min`;
  const hours = mins / 60;
  // Show whole number if no remainder
  if (mins % 60 === 0) return `${hours} hrs`;
  return `${parseFloat(hours.toFixed(1))} hrs`;
}

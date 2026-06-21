import { listItems, addItem } from "./store.js";
import { ymd } from "./dates.js";
import { logStudySession, appendDailyNoteLine } from "./vault.js";

const COL = "study_sessions";

// Study categories the user picks before a timer starts.
export const CATEGORIES = ["Class", "Certs", "General Cyber", "Projects", "Other"];

/**
 * Record a study session and auto-log it to the vault.
 * category: one of CATEGORIES. Certs sessions also append to the Security+
 * Study Tracker table.
 */
export function addSession({ category = "Other", subject = "", minutes = 0, kind = "focus", detail = null }) {
  const date = ymd();
  const row = addItem(COL, { date, category, subject, minutes: Math.round(minutes), kind, detail });

  const mins = Math.round(minutes);
  const label = subject ? `${category} - ${subject}` : category;
  try {
    appendDailyNoteLine("Study Log", `- ${label}: ${mins} min${detail ? ` (${detail})` : ""}`, date);
  } catch {}

  if (category === "Certs" || /security\+|sy0-701/i.test(subject)) {
    try {
      logStudySession({ date, duration: `${mins} min`, topics: `${label}${detail ? ` - ${detail}` : ""}` });
    } catch {}
  }
  return row;
}

export function todayMinutes() {
  const today = ymd();
  return listItems(COL).filter((s) => s.date === today).reduce((sum, s) => sum + (s.minutes || 0), 0);
}

export function recentSessions(limit = 30) {
  return listItems(COL).slice(-limit).reverse();
}

/** Daily totals (and per-category) for the last `days` - for the hours graph. */
export function dailySeries(days = 30) {
  const all = listItems(COL);
  const map = {};
  for (const s of all) {
    const e = (map[s.date] ||= { date: s.date, total: 0, byCategory: {} });
    e.total += s.minutes || 0;
    e.byCategory[s.category] = (e.byCategory[s.category] || 0) + (s.minutes || 0);
  }
  // Build a continuous window ending today.
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = ymd(d);
    out.push(map[key] || { date: key, total: 0, byCategory: {} });
  }
  return out;
}

export function categoryTotals() {
  const totals = {};
  for (const s of listItems(COL)) totals[s.category] = (totals[s.category] || 0) + (s.minutes || 0);
  return totals;
}

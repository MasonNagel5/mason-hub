import { getDb } from "./db.js";
import { ymd } from "./dates.js";
import { logStudySession, appendDailyNoteLine } from "./vault.js";

/**
 * Record a study/focus session and auto-log it to the vault.
 * kind: 'focus' (pomodoro) | 'flashcards'. Security+ sessions also append to the
 * Security+ Study Tracker table.
 */
export function addSession({ kind = "focus", subject, minutes = 0, detail = null }) {
  const db = getDb();
  const date = ymd();
  db.prepare("INSERT INTO study_sessions (date, kind, subject, minutes, detail) VALUES (?, ?, ?, ?, ?)").run(
    date,
    kind,
    subject,
    minutes,
    detail
  );

  const mins = Math.round(minutes);
  const label = kind === "flashcards" ? "Flashcards" : "Focus";
  const line = `- ${label}: ${subject} — ${mins} min${detail ? ` (${detail})` : ""}`;
  try {
    appendDailyNoteLine("Study Log", line, date);
  } catch {}

  // Route Security+ work to the dedicated tracker too.
  if (/security\+|sy0-701|secplus/i.test(subject)) {
    try {
      logStudySession({ date, duration: `${mins} min`, topics: `${subject}${detail ? ` — ${detail}` : ""}` });
    } catch {}
  }

  return { ok: true };
}

export function todayMinutes() {
  const row = getDb()
    .prepare("SELECT COALESCE(SUM(minutes),0) AS m FROM study_sessions WHERE date = ?")
    .get(ymd());
  return Math.round(row.m);
}

export function recentSessions(limit = 20) {
  return getDb().prepare("SELECT * FROM study_sessions ORDER BY id DESC LIMIT ?").all(limit);
}

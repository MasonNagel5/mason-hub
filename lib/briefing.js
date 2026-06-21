import { ymd, daysBetween } from "./dates.js";
import { todaysDomain, stats as flashStats } from "./flashcards.js";
import { upcomingAssignments, upcomingExams } from "./assignments.js";
import { dailyContact, listContacts } from "./contacts.js";
import { getDb } from "./db.js";
import { todayMinutes } from "./study.js";

const EXAM_DATE = "2026-07-20";

function raStatus() {
  const db = getDb();
  const now = new Date();
  const today = now.getDay();
  let onCallNow = false;
  let todayShift = null;
  for (const s of db.prepare("SELECT * FROM shifts").all()) {
    if (s.recurring) {
      if (s.weekday === today) {
        todayShift = todayShift || { start_time: s.start_time, end_time: s.end_time, title: s.title };
        const [sh, sm] = (s.start_time || "0:0").split(":").map(Number);
        const [eh, em] = (s.end_time || "0:0").split(":").map(Number);
        const mins = now.getHours() * 60 + now.getMinutes();
        if (mins >= sh * 60 + sm && mins <= eh * 60 + em) onCallNow = true;
      }
    } else {
      const st = new Date(s.start);
      const en = new Date(s.end);
      if (st.toDateString() === now.toDateString()) todayShift = todayShift || { title: s.title, start: s.start, end: s.end };
      if (now >= st && now <= en) onCallNow = true;
    }
  }
  return { onCallNow, todayShift };
}

function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function buildBriefing() {
  const today = ymd();
  const fs = safe(() => flashStats(), { totalDue: 0, weakest: null });
  return {
    date: today,
    securityPlus: {
      daysToExam: daysBetween(today, EXAM_DATE),
      examDate: EXAM_DATE,
      todaysDomain: safe(() => todaysDomain(), null),
      cardsDue: fs.totalDue,
      weakest: fs.weakest,
    },
    dueSoon: safe(() => upcomingAssignments(3).map((a) => ({ name: a.name, className: a.className, due: a.due })), []),
    examsSoon: safe(() => upcomingExams(14).map((e) => ({ name: e.name, className: e.className, due: e.due, daysUntil: e.daysUntil })), []),
    dailyContact: safe(() => dailyContact(), null),
    overdueContactCount: safe(() => listContacts().filter((c) => c.dueForFollowUp).length, 0),
    ra: safe(() => raStatus(), { onCallNow: false, todayShift: null }),
    studyMinutesToday: safe(() => todayMinutes(), 0),
  };
}

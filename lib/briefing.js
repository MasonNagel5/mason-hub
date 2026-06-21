import { ymd, daysBetween } from "./dates.js";
import { pplFor } from "./ppl.js";
import { todaysDomain, stats as flashStats } from "./flashcards.js";
import { upcomingAssignments, upcomingExams } from "./assignments.js";
import { dailyContact, listContacts } from "./contacts.js";
import { getDb } from "./db.js";
import { todayMinutes } from "./study.js";

const EXAM_DATE = "2026-07-20";

// Is there an RA shift covering right now / today?
function raStatus() {
  const db = getDb();
  const now = new Date();
  const today = now.getDay();
  const shifts = db.prepare("SELECT * FROM shifts").all();
  let onCallNow = false;
  let todayShift = null;
  for (const s of shifts) {
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
      if (st.toDateString() === now.toDateString()) todayShift = todayShift || { start_time: null, end_time: null, title: s.title, start: s.start, end: s.end };
      if (now >= st && now <= en) onCallNow = true;
    }
  }
  return { onCallNow, todayShift };
}

export function buildBriefing() {
  const today = ymd();
  const ppl = pplFor(today);
  const daysToExam = daysBetween(today, EXAM_DATE);
  const fs = (() => {
    try {
      return flashStats();
    } catch {
      return { totalDue: 0, weakest: null };
    }
  })();

  const due72 = (() => {
    try {
      return upcomingAssignments(3);
    } catch {
      return [];
    }
  })();
  const exams = (() => {
    try {
      return upcomingExams(14);
    } catch {
      return [];
    }
  })();

  const overdueContacts = (() => {
    try {
      return listContacts().filter((c) => c.dueForFollowUp);
    } catch {
      return [];
    }
  })();

  return {
    date: today,
    ppl,
    securityPlus: {
      daysToExam,
      examDate: EXAM_DATE,
      todaysDomain: (() => { try { return todaysDomain(); } catch { return null; } })(),
      cardsDue: fs.totalDue,
      weakest: fs.weakest,
    },
    dueSoon: due72.map((a) => ({ name: a.name, className: a.className, due: a.due })),
    examsSoon: exams.map((e) => ({ name: e.name, className: e.className, due: e.due, daysUntil: e.daysUntil })),
    dailyContact: (() => { try { return dailyContact(); } catch { return null; } })(),
    overdueContactCount: overdueContacts.length,
    ra: raStatus(),
    studyMinutesToday: (() => { try { return todayMinutes(); } catch { return 0; } })(),
  };
}

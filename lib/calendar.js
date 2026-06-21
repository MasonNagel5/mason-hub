import { getDb } from "./db.js";
import { assignmentsInRange } from "./assignments.js";
import { listItems } from "./store.js";

// Expand a recurring weekly shift into concrete instances within [start, end].
function expandShift(shift, start, end) {
  const out = [];
  if (!shift.recurring) {
    const s = new Date(shift.start);
    if (s >= start && s <= end) {
      out.push({
        id: `shift-${shift.id}`,
        source: "shift",
        title: shift.title,
        start: shift.start,
        end: shift.end,
        notes: shift.notes,
      });
    }
    return out;
  }
  // Weekly: walk each day in range, emit on matching weekday.
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  while (cur <= end) {
    if (cur.getDay() === shift.weekday) {
      const [sh, sm] = (shift.start_time || "00:00").split(":").map(Number);
      const [eh, em] = (shift.end_time || "00:00").split(":").map(Number);
      const s = new Date(cur);
      s.setHours(sh, sm, 0, 0);
      const e = new Date(cur);
      e.setHours(eh, em, 0, 0);
      out.push({
        id: `shift-${shift.id}-${s.toISOString().slice(0, 10)}`,
        source: "shift",
        title: shift.title,
        start: s.toISOString(),
        end: e.toISOString(),
        notes: shift.notes,
      });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** All calendar items (assignments + shifts + manual events) within an ISO range. */
export async function getCalendar(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const db = getDb();
  const items = [];

  // Class assignments (manual)
  try {
    items.push(...assignmentsInRange(startISO, endISO));
  } catch {}

  // RA shifts
  for (const sh of db.prepare("SELECT * FROM shifts").all()) {
    items.push(...expandShift(sh, start, end));
  }

  // Manual events
  for (const e of db.prepare("SELECT * FROM events").all()) {
    const s = new Date(e.start);
    if (s >= start && s <= end) {
      items.push({
        id: `event-${e.id}`,
        source: "manual",
        title: e.title,
        start: e.start,
        end: e.end,
        location: e.location,
        notes: e.notes,
      });
    }
  }

  // Manual to-do tasks that carry a due date
  try {
    for (const t of listItems("tasks")) {
      if (t.source !== "manual" || !t.due) continue;
      const s = new Date(t.due);
      if (s >= start && s <= end) {
        items.push({ id: `task-${t.id}`, source: "task", title: t.title, start: t.due, end: null, done: !!t.done });
      }
    }
  } catch {}

  items.sort((a, b) => new Date(a.start) - new Date(b.start));
  return items;
}

/** Events within the next `hours` (default 48), for the dashboard. */
export async function getUpcomingEvents(hours = 48) {
  const now = new Date();
  const end = new Date(now.getTime() + hours * 3600000);
  const items = await getCalendar(now.toISOString(), end.toISOString());
  return items.filter((i) => new Date(i.start) >= new Date(now.getTime() - 3600000));
}

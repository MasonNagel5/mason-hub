import { getDb } from "./db.js";
import { classBySlug } from "./classes.js";

export function listAssignments(classSlug) {
  return getDb()
    .prepare("SELECT * FROM assignments WHERE class_slug = ? ORDER BY due IS NULL, due ASC, id DESC")
    .all(classSlug);
}

export function addAssignment({ classSlug, name, due, status, points, notes, type }) {
  const info = getDb()
    .prepare(
      "INSERT INTO assignments (class_slug, name, due, status, points, notes, type) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(classSlug, name.trim(), due || null, status || "upcoming", numOrNull(points), notes || null, type || "assignment");
  return info.lastInsertRowid;
}

export function updateAssignment(id, fields) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM assignments WHERE id = ?").get(id);
  if (!row) return null;
  db.prepare(
    "UPDATE assignments SET name = COALESCE(?, name), due = ?, status = COALESCE(?, status), type = COALESCE(?, type), points = ?, notes = ? WHERE id = ?"
  ).run(
    fields.name ?? null,
    fields.due !== undefined ? fields.due : row.due,
    fields.status ?? null,
    fields.type ?? null,
    fields.points !== undefined ? numOrNull(fields.points) : row.points,
    fields.notes !== undefined ? fields.notes : row.notes,
    id
  );
  return db.prepare("SELECT * FROM assignments WHERE id = ?").get(id);
}

export function deleteAssignment(id) {
  getDb().prepare("DELETE FROM assignments WHERE id = ?").run(id);
}

/** All non-submitted assignments with a due date inside [now-12h, now+days]. */
export function upcomingAssignments(days = 7) {
  const rows = getDb()
    .prepare("SELECT * FROM assignments WHERE status != 'submitted' AND due IS NOT NULL")
    .all();
  const now = Date.now();
  const horizon = now + days * 86400000;
  return rows
    .filter((a) => {
      const t = new Date(a.due).getTime();
      return t >= now - 12 * 3600000 && t <= horizon;
    })
    .map((a) => ({ ...a, className: classBySlug(a.class_slug)?.name || a.class_slug }))
    .sort((a, b) => new Date(a.due) - new Date(b.due));
}

/** Assignments with a due date inside an ISO range — for the calendar. */
export function assignmentsInRange(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return getDb()
    .prepare("SELECT * FROM assignments WHERE due IS NOT NULL")
    .all()
    .filter((a) => {
      const t = new Date(a.due);
      return t >= start && t <= end;
    })
    .map((a) => ({
      id: `assignment-${a.id}`,
      source: "assignment",
      title: a.name,
      start: a.due,
      end: null,
      status: a.status,
      points: a.points,
      className: classBySlug(a.class_slug)?.name || a.class_slug,
    }));
}

/** Upcoming exams (type='exam', future due) across all classes, soonest first. */
export function upcomingExams(days = 60) {
  const now = Date.now();
  const horizon = now + days * 86400000;
  return getDb()
    .prepare("SELECT * FROM assignments WHERE type = 'exam' AND due IS NOT NULL AND status != 'submitted'")
    .all()
    .filter((e) => {
      const t = new Date(e.due).getTime();
      return t >= now - 12 * 3600000 && t <= horizon;
    })
    .map((e) => ({
      ...e,
      className: classBySlug(e.class_slug)?.name || e.class_slug,
      daysUntil: Math.ceil((new Date(e.due).getTime() - now) / 86400000),
    }))
    .sort((a, b) => new Date(a.due) - new Date(b.due));
}

function numOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

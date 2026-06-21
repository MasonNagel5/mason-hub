import { listItems, addItem, updateItem, deleteItem } from "./store.js";
import { classBySlug } from "./classes.js";

// Coursework (assignments + exams) - stored in the vault so it syncs across
// devices. Collection name: "assignments".
const COL = "assignments";

export function listAssignments(classSlug) {
  return listItems(COL)
    .filter((a) => a.class_slug === classSlug)
    .sort((a, b) => {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    });
}

export function addAssignment({ classSlug, name, due, status, points, notes, type }) {
  const row = addItem(COL, {
    class_slug: classSlug,
    name: name.trim(),
    due: due || null,
    status: status || "upcoming",
    type: type || "assignment",
    points: numOrNull(points),
    notes: notes || null,
  });
  return row.id;
}

export function updateAssignment(id, fields) {
  const patch = {};
  for (const k of ["name", "due", "status", "type", "notes"]) {
    if (fields[k] !== undefined && fields[k] !== null) patch[k] = fields[k];
  }
  if (fields.due !== undefined) patch.due = fields.due;
  if (fields.points !== undefined) patch.points = numOrNull(fields.points);
  return updateItem(COL, id, patch);
}

export function deleteAssignment(id) {
  deleteItem(COL, id);
}

/** All non-submitted assignments with a due date inside [now-12h, now+days]. */
export function upcomingAssignments(days = 7) {
  const now = Date.now();
  const horizon = now + days * 86400000;
  return listItems(COL)
    .filter((a) => a.status !== "submitted" && a.due)
    .filter((a) => {
      const t = new Date(a.due).getTime();
      return t >= now - 12 * 3600000 && t <= horizon;
    })
    .map((a) => ({ ...a, className: classBySlug(a.class_slug)?.name || a.class_slug }))
    .sort((a, b) => new Date(a.due) - new Date(b.due));
}

/** Upcoming exams (type='exam', future due) across all classes, soonest first. */
export function upcomingExams(days = 60) {
  const now = Date.now();
  const horizon = now + days * 86400000;
  return listItems(COL)
    .filter((e) => e.type === "exam" && e.due && e.status !== "submitted")
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

/** Assignments with a due date inside an ISO range - for the calendar. */
export function assignmentsInRange(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return listItems(COL)
    .filter((a) => a.due)
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
      type: a.type,
      points: a.points,
      className: classBySlug(a.class_slug)?.name || a.class_slug,
    }));
}

function numOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

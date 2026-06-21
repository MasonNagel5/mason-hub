import { getDb } from "./db.js";
import { ymd } from "./dates.js";
import { pplFor } from "./ppl.js";

// Epley estimated one-rep max.
function est1RM(weight, reps) {
  if (!weight || !reps) return weight || 0;
  return Math.round(weight * (1 + reps / 30));
}

// ---- workout sets ----

/** Log one or more sets for an exercise on a date. `sets` = [{weight, reps}]. */
export function addSets({ date, exercise, sets, notes }) {
  const db = getDb();
  const day = date || ymd();
  const ppl = pplFor(day);
  const insert = db.prepare(
    "INSERT INTO workout_sets (date, exercise, weight, reps, set_num, ppl, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const tx = db.transaction((rows) => {
    rows.forEach((s, i) => {
      insert.run(day, exercise.trim(), num(s.weight), int(s.reps), i + 1, ppl, notes || null);
    });
  });
  tx(sets.filter((s) => s.weight != null || s.reps != null));
  return listSets({ exercise });
}

export function listSets({ exercise, limit = 200 } = {}) {
  const db = getDb();
  const rows = exercise
    ? db.prepare("SELECT * FROM workout_sets WHERE exercise = ? ORDER BY date DESC, set_num ASC LIMIT ?").all(exercise, limit)
    : db.prepare("SELECT * FROM workout_sets ORDER BY date DESC, id DESC LIMIT ?").all(limit);
  return rows;
}

export function deleteSet(id) {
  getDb().prepare("DELETE FROM workout_sets WHERE id = ?").run(id);
}

export function listExercises() {
  return getDb()
    .prepare("SELECT exercise, COUNT(*) AS n, MAX(date) AS last FROM workout_sets GROUP BY exercise ORDER BY last DESC")
    .all();
}

/**
 * Per-session progress for one exercise: for each date, the heaviest set,
 * the best estimated 1RM, and total volume (Σ weight×reps).
 */
export function progress(exercise) {
  const rows = getDb()
    .prepare("SELECT * FROM workout_sets WHERE exercise = ? ORDER BY date ASC")
    .all(exercise);
  const byDate = new Map();
  for (const r of rows) {
    const e = byDate.get(r.date) || { date: r.date, topWeight: 0, best1RM: 0, volume: 0, sets: 0 };
    e.topWeight = Math.max(e.topWeight, r.weight || 0);
    e.best1RM = Math.max(e.best1RM, est1RM(r.weight, r.reps));
    e.volume += (r.weight || 0) * (r.reps || 0);
    e.sets += 1;
    byDate.set(r.date, e);
  }
  return Array.from(byDate.values());
}

// ---- bodyweight ----

export function addWeight(date, weight) {
  getDb()
    .prepare(
      "INSERT INTO body_weight (date, weight) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET weight = excluded.weight"
    )
    .run(date || ymd(), num(weight));
  return listWeights();
}

export function listWeights() {
  return getDb().prepare("SELECT * FROM body_weight ORDER BY date ASC").all();
}

export function deleteWeight(id) {
  getDb().prepare("DELETE FROM body_weight WHERE id = ?").run(id);
}

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function int(v) {
  const n = num(v);
  return n == null ? null : Math.round(n);
}

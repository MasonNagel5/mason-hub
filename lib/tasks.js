import { getDb } from "./db.js";
import { ymd, nowLocalStamp } from "./dates.js";
import { pplFor } from "./ppl.js";
import { get } from "./settings.js";
import { readProjects, readInbox, logCompletedTask } from "./vault.js";
import { upcomingAssignments } from "./assignments.js";

const SECURITY_PLUS_EXAM = "2026-07-20"; // target exam date from the spec

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/**
 * Insert a derived task if its ext_id is new; otherwise refresh its mutable
 * fields while preserving done state. Returns the row.
 */
function materialize({ title, source, due = null, ext_id, meta = null, day = null }) {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM tasks WHERE ext_id = ?").get(ext_id);
  if (existing) {
    db.prepare("UPDATE tasks SET title = ?, due = ?, meta = ? WHERE id = ?").run(
      title,
      due,
      meta ? JSON.stringify(meta) : existing.meta,
      existing.id
    );
    return db.prepare("SELECT * FROM tasks WHERE id = ?").get(existing.id);
  }
  const info = db
    .prepare(
      "INSERT INTO tasks (title, source, due, ext_id, meta, day) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(title, source, due, ext_id, meta ? JSON.stringify(meta) : null, day || ymd());
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
}

/** Build & persist today's task set, then return it (with done state). */
export async function getDailyTasks() {
  const today = ymd();

  // --- recurring: gym (PPL) ---
  const ppl = pplFor(today);
  if (ppl && ppl !== "Rest") {
    materialize({
      title: `Gym — ${ppl}`,
      source: "recurring",
      ext_id: `gym-${today}`,
      day: today,
      meta: { kind: "gym", ppl },
    });
  }

  // --- recurring: Security+ study (until exam date) ---
  if (today <= SECURITY_PLUS_EXAM) {
    materialize({
      title: "Security+ study — Professor Messer SY0-701",
      source: "recurring",
      ext_id: `secplus-${today}`,
      day: today,
      meta: { kind: "security-plus" },
    });
  }

  // --- class assignments due within 7 days (manual) ---
  try {
    for (const a of upcomingAssignments(7)) {
      materialize({
        title: `${a.name} (${a.className})`,
        source: "assignment",
        due: a.due,
        ext_id: `assignment-${a.id}`,
        meta: { kind: "assignment", points: a.points, className: a.className },
      });
    }
  } catch {}

  // --- vault inbox items ---
  try {
    for (const item of readInbox()) {
      materialize({
        title: item,
        source: "inbox",
        ext_id: `inbox-${slug(item)}`,
        meta: { kind: "inbox" },
      });
    }
  } catch {}

  // --- active project next actions ---
  try {
    for (const p of readProjects()) {
      if (!p.nextAction) continue;
      materialize({
        title: `${p.nextAction}`,
        source: "project",
        ext_id: `project-${slug(p.folder)}`,
        meta: { kind: "project", project: p.title, status: p.status },
      });
    }
  } catch {}

  // --- return: not-done tasks + anything completed today ---
  const rows = getDb()
    .prepare(
      `SELECT * FROM tasks
       WHERE done = 0
          OR (done = 1 AND substr(done_at,1,10) = ?)
       ORDER BY done ASC,
                CASE source WHEN 'assignment' THEN 0 WHEN 'project' THEN 1
                            WHEN 'recurring' THEN 2 WHEN 'inbox' THEN 3 ELSE 4 END,
                due IS NULL, due ASC, id ASC`
    )
    .all(today);

  return rows.map(rowToTask);
}

function rowToTask(r) {
  return {
    id: r.id,
    title: r.title,
    source: r.source,
    due: r.due,
    done: !!r.done,
    doneAt: r.done_at,
    meta: r.meta ? JSON.parse(r.meta) : null,
  };
}

export function addManualTask(title, due = null) {
  const db = getDb();
  const info = db
    .prepare("INSERT INTO tasks (title, source, due, day) VALUES (?, 'manual', ?, ?)")
    .run(title, due, ymd());
  return rowToTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid));
}

export function setTaskDone(id, done) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!row) return null;
  const doneAt = done ? nowLocalStamp() : null;
  db.prepare("UPDATE tasks SET done = ?, done_at = ? WHERE id = ?").run(done ? 1 : 0, doneAt, id);
  if (done) {
    try {
      logCompletedTask(row.title);
    } catch {}
  }
  return rowToTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
}

export function deleteTask(id) {
  getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id);
}

/** Titles completed today — for the end-of-day summary. */
export function completedToday() {
  return getDb()
    .prepare("SELECT title FROM tasks WHERE done = 1 AND substr(done_at,1,10) = ? ORDER BY done_at ASC")
    .all(ymd())
    .map((r) => r.title);
}

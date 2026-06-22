import { listItems, addItem, updateItem, deleteItem, replaceAll, readStore, writeStore } from "./store.js";
import { ymd, nowLocalStamp } from "./dates.js";
import { readProjects, readInbox, logCompletedTask } from "./vault.js";
import { upcomingAssignments } from "./assignments.js";

const COL = "tasks";
const DISMISSED = "tasks-dismissed"; // array of ext_ids the user has deleted
const SECURITY_PLUS_EXAM = "2026-07-20";

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

// ext_ids of suggested tasks the user deleted, so they don't get re-materialized.
function isDismissed(ext_id) {
  return readStore(DISMISSED, []).includes(ext_id);
}
function dismiss(ext_id) {
  const arr = readStore(DISMISSED, []);
  if (!arr.includes(ext_id)) {
    arr.push(ext_id);
    writeStore(DISMISSED, arr);
  }
}

// Insert a derived task if its ext_id is new; refresh mutable fields otherwise
// while preserving done state. Skips anything the user has dismissed.
function materialize({ title, source, due = null, ext_id, meta = null }) {
  if (isDismissed(ext_id)) return null;
  const arr = listItems(COL);
  const existing = arr.find((t) => t.ext_id === ext_id);
  if (existing) {
    return updateItem(COL, existing.id, { title, due, meta: meta || existing.meta });
  }
  return addItem(COL, { title, source, due, ext_id, meta, done: false, doneAt: null, day: ymd() });
}

/** Build & persist today's task set, then return it. */
export async function getDailyTasks() {
  const today = ymd();

  // Security+ recurring study reminder until the exam date.
  if (today <= SECURITY_PLUS_EXAM) {
    materialize({
      title: "Security+ study - Professor Messer SY0-701",
      source: "recurring",
      ext_id: `secplus-${today}`,
      meta: { kind: "security-plus" },
    });
  }

  // Class assignments due within 7 days.
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

  // Vault inbox items.
  try {
    for (const item of readInbox()) {
      materialize({ title: item, source: "inbox", ext_id: `inbox-${slug(item)}`, meta: { kind: "inbox" } });
    }
  } catch {}

  // Active project next actions.
  try {
    for (const p of readProjects()) {
      if (!p.nextAction) continue;
      materialize({
        title: p.nextAction,
        source: "project",
        ext_id: `project-${slug(p.folder)}`,
        meta: { kind: "project", project: p.title, status: p.status },
      });
    }
  } catch {}

  // Return: open tasks + anything completed today.
  const order = { assignment: 0, project: 1, recurring: 2, inbox: 3, manual: 4 };
  return listItems(COL)
    .filter((t) => !t.done || (t.doneAt && t.doneAt.slice(0, 10) === today))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const so = (order[a.source] ?? 5) - (order[b.source] ?? 5);
      if (so) return so;
      if (a.due && b.due) return new Date(a.due) - new Date(b.due);
      return (a.due ? 0 : 1) - (b.due ? 0 : 1);
    });
}

export function addManualTask(title, due = null) {
  return addItem(COL, { title, source: "manual", due, done: false, doneAt: null, day: ymd() });
}

export function setTaskDone(id, done) {
  const row = listItems(COL).find((t) => t.id === id);
  if (!row) return null;
  const updated = updateItem(COL, id, { done, doneAt: done ? nowLocalStamp() : null });
  if (done) {
    try {
      logCompletedTask(row.title);
    } catch {}
  }
  return updated;
}

export function deleteTask(id) {
  const row = listItems(COL).find((t) => t.id === id);
  // Suggested tasks would just get re-created on the next load, so remember
  // that this one was deleted and skip re-materializing it.
  if (row?.ext_id) dismiss(row.ext_id);
  deleteItem(COL, id);
}

export function completedToday() {
  const today = ymd();
  return listItems(COL)
    .filter((t) => t.done && t.doneAt && t.doneAt.slice(0, 10) === today)
    .map((t) => t.title);
}

/** Prune old completed derived tasks so the store doesn't grow unbounded. */
export function pruneTasks() {
  const today = ymd();
  const keep = listItems(COL).filter(
    (t) => !t.done || t.source === "manual" || (t.doneAt && t.doneAt.slice(0, 10) === today)
  );
  replaceAll(COL, keep);
}

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

let _db = null;

/**
 * Singleton SQLite connection. The DB file lives OUTSIDE the project tree, under
 * %LOCALAPPDATA%\MasonProductivity (or ~/.local/share as a fallback). This keeps
 * it off the OneDrive-synced Desktop folder — OneDrive sync corrupts SQLite WAL
 * files and resurrects deleted ones. Override with MASON_DATA_DIR if desired.
 * Holds app state that supplements the Obsidian vault (settings, shifts,
 * manual events, manual tasks, contacts, per-class contacts, transcripts index).
 */
function dataDirPath() {
  if (process.env.MASON_DATA_DIR) return process.env.MASON_DATA_DIR;
  const base =
    process.env.LOCALAPPDATA ||
    (process.platform === "win32"
      ? path.join(os.homedir(), "AppData", "Local")
      : path.join(os.homedir(), ".local", "share"));
  return path.join(base, "MasonProductivity");
}

export function getDb() {
  if (_db) return _db;

  const dataDir = dataDirPath();
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(path.join(dataDir, "app.db"));
  db.pragma("journal_mode = WAL");
  migrate(db);
  _db = db;
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      source     TEXT NOT NULL DEFAULT 'manual',   -- manual | assignment | inbox | project | recurring
      due        TEXT,                              -- ISO date (optional)
      done       INTEGER NOT NULL DEFAULT 0,
      done_at    TEXT,
      day        TEXT,                              -- YYYY-MM-DD this task belongs to
      ext_id     TEXT,                              -- external id (e.g. assignment-12) for dedupe
      meta       TEXT,                              -- JSON blob
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL DEFAULT 'RA Shift',
      start       TEXT NOT NULL,                    -- ISO datetime
      end         TEXT NOT NULL,                    -- ISO datetime
      recurring   INTEGER NOT NULL DEFAULT 0,       -- 0 = one-off, 1 = weekly
      weekday     INTEGER,                          -- 0=Sun..6=Sat (for recurring)
      start_time  TEXT,                             -- HH:MM (for recurring)
      end_time    TEXT,                             -- HH:MM (for recurring)
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      start       TEXT NOT NULL,                    -- ISO datetime
      end         TEXT,                             -- ISO datetime
      location    TEXT,
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      org           TEXT,
      role          TEXT,
      notes         TEXT,
      last_contact  TEXT,                           -- ISO date
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS class_contacts (
      class_slug  TEXT PRIMARY KEY,
      data        TEXT                              -- JSON: { professor, email, officeHours, ta, other }
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      class_slug  TEXT NOT NULL,
      name        TEXT NOT NULL,
      due         TEXT,                             -- ISO datetime (optional)
      status      TEXT NOT NULL DEFAULT 'upcoming', -- upcoming | submitted | missing
      type        TEXT NOT NULL DEFAULT 'assignment', -- assignment | exam | quiz | project
      points      REAL,
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_assign_class ON assignments (class_slug, due);

    CREATE TABLE IF NOT EXISTS class_resources (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      class_slug  TEXT NOT NULL,
      label       TEXT NOT NULL,
      url         TEXT,
      kind        TEXT,                             -- textbook | link | tool | reference
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      class_slug  TEXT NOT NULL,
      title       TEXT NOT NULL,
      file_path   TEXT NOT NULL,
      text        TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL,                    -- YYYY-MM-DD
      exercise    TEXT NOT NULL,
      weight      REAL,                             -- lbs
      reps        INTEGER,
      set_num     INTEGER,
      ppl         TEXT,                             -- Push | Pull | Legs snapshot
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_workout_ex ON workout_sets (exercise, date);

    CREATE TABLE IF NOT EXISTS body_weight (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL UNIQUE,             -- YYYY-MM-DD
      weight      REAL NOT NULL,                    -- lbs
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Spaced-repetition progress per Security+ card (cards themselves are in
    -- lib/secplus-deck.js; we store only review state keyed by card id).
    CREATE TABLE IF NOT EXISTS flashcard_progress (
      card_id       TEXT PRIMARY KEY,
      ease          REAL NOT NULL DEFAULT 2.5,
      interval_days REAL NOT NULL DEFAULT 0,
      reps          INTEGER NOT NULL DEFAULT 0,
      lapses        INTEGER NOT NULL DEFAULT 0,
      due           TEXT,                            -- YYYY-MM-DD next review
      last_reviewed TEXT
    );

    -- Study/focus sessions (pomodoro + flashcard reviews).
    CREATE TABLE IF NOT EXISTS study_sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL,                    -- YYYY-MM-DD
      kind        TEXT NOT NULL DEFAULT 'focus',    -- focus | flashcards
      subject     TEXT NOT NULL,
      minutes     REAL NOT NULL DEFAULT 0,
      detail      TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gov_applications (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      agency       TEXT NOT NULL,
      role         TEXT,
      applied_date TEXT,
      status       TEXT NOT NULL DEFAULT 'interested', -- interested | applied | interview | offer | rejected | accepted
      next_action  TEXT,
      deadline     TEXT,
      url          TEXT,
      notes        TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clearance_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      category   TEXT NOT NULL,
      label      TEXT NOT NULL,
      done       INTEGER NOT NULL DEFAULT 0,
      notes      TEXT,
      sort       INTEGER NOT NULL DEFAULT 0,
      seeded     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS resume_bullets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      context     TEXT NOT NULL DEFAULT 'SWE Internship',
      raw         TEXT NOT NULL,
      what        TEXT,                             -- X: what you accomplished
      metric      TEXT,                             -- Y: measured by
      method      TEXT,                             -- Z: by doing
      xyz         TEXT,                             -- assembled bullet
      ready       INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Guarded migration for older DBs missing assignments.type.
  try {
    const cols = db.prepare("PRAGMA table_info(assignments)").all();
    if (!cols.some((c) => c.name === "type")) {
      db.exec("ALTER TABLE assignments ADD COLUMN type TEXT NOT NULL DEFAULT 'assignment'");
    }
  } catch {}
}

// ---- settings helpers ----
export function getSetting(key, fallback = null) {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value == null ? null : String(value));
}

export function getAllSettings() {
  const rows = getDb().prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

let _db = null;

/**
 * Machine-local SQLite. Lives OUTSIDE the OneDrive-synced project tree at
 * %LOCALAPPDATA%\MasonProductivity (override with MASON_DATA_DIR) because
 * OneDrive corrupts/ resurrects WAL files. This holds only state that is
 * legitimately per-machine: settings (incl. the vault path, which differs on
 * Mac vs PC) and calendar shifts/events. All user content lives in the vault
 * via lib/store.js so it syncs across devices.
 */
function dataDirPath() {
  if (process.env.MASON_DATA_DIR) return process.env.MASON_DATA_DIR;
  const base =
    process.env.LOCALAPPDATA ||
    (process.platform === "win32" ? path.join(os.homedir(), "AppData", "Local") : path.join(os.homedir(), ".local", "share"));
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

    CREATE TABLE IF NOT EXISTS shifts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL DEFAULT 'RA Shift',
      start       TEXT NOT NULL,
      end         TEXT NOT NULL,
      recurring   INTEGER NOT NULL DEFAULT 0,
      weekday     INTEGER,
      start_time  TEXT,
      end_time    TEXT,
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      start       TEXT NOT NULL,
      end         TEXT,
      location    TEXT,
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ---- settings helpers ----
export function getSetting(key, fallback = null) {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  getDb()
    .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value == null ? null : String(value));
}

export function getAllSettings() {
  const rows = getDb().prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

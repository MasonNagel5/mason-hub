import { getDb } from "./db.js";
import { ymd, daysBetween } from "./dates.js";
import { readDailyNote } from "./vault.js";

export function listContacts() {
  const rows = getDb().prepare("SELECT * FROM contacts ORDER BY name").all();
  const today = ymd();
  return rows.map((r) => ({
    ...r,
    daysSince: r.last_contact ? daysBetween(r.last_contact, today) : null,
    dueForFollowUp: !r.last_contact || daysBetween(r.last_contact, today) >= 30,
  }));
}

/** Deterministic daily pick — prefers contacts due for follow-up. */
export function dailyContact() {
  const all = listContacts();
  if (all.length === 0) return null;
  const pool = all.filter((c) => c.dueForFollowUp);
  const list = pool.length ? pool : all;
  // Day-of-year as a rotating index.
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((new Date() - start) / 86400000);
  return list[dayOfYear % list.length];
}

/**
 * Parse the org-prefixed name lists out of a daily note (the LinkedIn blitz
 * format: "PNNL: Jovana Helms, Christopher Keane, ...").
 */
export function parseContactsFromDailyNote(dateStr = "2026-06-20") {
  const text = readDailyNote(dateStr);
  if (!text) return [];
  const found = [];
  const seen = new Set();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    // "Org: Name, Name, Name" — org is short, value has comma-separated names.
    const m = line.match(/^([A-Za-z][A-Za-z0-9 /&'.+-]{1,28}):\s+(.+)$/);
    if (!m) continue;
    const org = m[1].trim();
    // Skip prose lines (headings, sentences) — require the value to look like a name list.
    const value = m[2];
    if (value.length > 400) continue;
    if (/[.!?]$/.test(value) && !value.includes(",")) continue;
    const names = value.split(",").map((s) => s.trim()).filter(Boolean);
    for (const n of names) {
      // A name is short, has a letter, no sentence punctuation.
      const clean = n.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
      if (clean.length < 3 || clean.length > 40) continue;
      if (!/^[A-Za-z]/.test(clean)) continue;
      if (/[.!?:]/.test(clean)) continue;
      const key = `${clean}|${org}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ name: clean, org });
    }
  }
  return found;
}

export function importContacts(rows) {
  const db = getDb();
  const insert = db.prepare(
    "INSERT INTO contacts (name, org) VALUES (?, ?)"
  );
  const existing = new Set(
    db.prepare("SELECT name, org FROM contacts").all().map((r) => `${r.name}|${r.org}`.toLowerCase())
  );
  let added = 0;
  const tx = db.transaction((items) => {
    for (const it of items) {
      const key = `${it.name}|${it.org || ""}`.toLowerCase();
      if (existing.has(key)) continue;
      insert.run(it.name, it.org || null);
      existing.add(key);
      added++;
    }
  });
  tx(rows);
  return added;
}

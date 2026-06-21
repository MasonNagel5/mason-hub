import { readDailyNote } from "./vault.js";

/**
 * Parse the org-prefixed name lists out of a daily note (the LinkedIn blitz
 * format: "PNNL: Jovana Helms, Christopher Keane, ..."). Used to seed the
 * networking tracker. Returns [{ name, org }].
 */
export function parseContactsFromDailyNote(dateStr = "2026-06-20") {
  const text = readDailyNote(dateStr);
  if (!text) return [];
  const found = [];
  const seen = new Set();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const m = line.match(/^([A-Za-z][A-Za-z0-9 /&'.+-]{1,28}):\s+(.+)$/);
    if (!m) continue;
    const org = m[1].trim();
    const value = m[2];
    if (value.length > 400) continue;
    if (/[.!?]$/.test(value) && !value.includes(",")) continue;
    for (const n of value.split(",").map((s) => s.trim()).filter(Boolean)) {
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

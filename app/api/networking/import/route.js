import { NextResponse } from "next/server";
import { parseContactsFromDailyNote } from "@/lib/contacts.js";
import { listItems, replaceAll } from "@/lib/store.js";

// Parse the LinkedIn-blitz roster out of the 6/20 daily note into the
// networking tracker (vault-backed), de-duped against what's already there.
export async function POST(req) {
  let date = "2026-06-20";
  try { const b = await req.json(); if (b?.date) date = b.date; } catch {}
  const parsed = parseContactsFromDailyNote(date);
  const existing = listItems("networking");
  const seen = new Set(existing.map((r) => `${(r.name || "").toLowerCase()}|${(r.org || "").toLowerCase()}`));
  let added = 0;
  const merged = [...existing];
  for (const c of parsed) {
    const key = `${c.name.toLowerCase()}|${(c.org || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      id: Date.now().toString(36) + added,
      createdAt: new Date().toISOString(),
      name: c.name, org: c.org || "", role: "", status: "To reach out", channel: "LinkedIn", lastContact: "", notes: "",
    });
    added++;
  }
  replaceAll("networking", merged);
  return NextResponse.json({ ok: true, parsed: parsed.length, added });
}

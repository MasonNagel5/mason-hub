import { NextResponse } from "next/server";
import { parseContactsFromDailyNote, importContacts } from "@/lib/contacts.js";

// Import the contact list out of the 6/20 daily note (LinkedIn blitz roster).
export async function POST(req) {
  let date = "2026-06-20";
  try {
    const b = await req.json();
    if (b?.date) date = b.date;
  } catch {}
  const parsed = parseContactsFromDailyNote(date);
  const added = importContacts(parsed);
  return NextResponse.json({ ok: true, parsed: parsed.length, added });
}

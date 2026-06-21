import { NextResponse } from "next/server";
import { createMeetingNote } from "@/lib/vault.js";

export async function POST(req) {
  const b = await req.json();
  const attendees = (b.attendees || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const r = createMeetingNote({ title: b.title, re: b.re || b.title, attendees });
  return NextResponse.json({ ok: true, ...r });
}

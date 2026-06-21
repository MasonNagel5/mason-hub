import { NextResponse } from "next/server";
import { addSession, todayMinutes, recentSessions } from "@/lib/study.js";

export async function GET() {
  return NextResponse.json({ todayMinutes: todayMinutes(), recent: recentSessions() });
}

export async function POST(req) {
  const b = await req.json();
  if (!b.subject?.trim()) return NextResponse.json({ error: "subject required" }, { status: 400 });
  addSession({ kind: b.kind, subject: b.subject.trim(), minutes: Number(b.minutes) || 0, detail: b.detail || null });
  return NextResponse.json({ ok: true, todayMinutes: todayMinutes() });
}

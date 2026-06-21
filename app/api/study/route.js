import { NextResponse } from "next/server";
import { addSession, todayMinutes, recentSessions, dailySeries, categoryTotals, CATEGORIES } from "@/lib/study.js";

export async function GET() {
  return NextResponse.json({
    todayMinutes: todayMinutes(),
    recent: recentSessions(),
    series: dailySeries(30),
    categoryTotals: categoryTotals(),
    categories: CATEGORIES,
  });
}

export async function POST(req) {
  const b = await req.json();
  addSession({
    category: b.category || "Other",
    subject: (b.subject || "").trim(),
    minutes: Number(b.minutes) || 0,
    kind: b.kind || "focus",
    detail: b.detail || null,
  });
  return NextResponse.json({ ok: true, todayMinutes: todayMinutes() });
}

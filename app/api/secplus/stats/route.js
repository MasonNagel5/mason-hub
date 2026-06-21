import { NextResponse } from "next/server";
import { stats, todaysDomain } from "@/lib/flashcards.js";
import { daysBetween, ymd } from "@/lib/dates.js";

const EXAM_DATE = "2026-07-20";

export async function GET() {
  const s = stats();
  const daysToExam = daysBetween(ymd(), EXAM_DATE);
  return NextResponse.json({ ...s, todaysDomain: todaysDomain(), examDate: EXAM_DATE, daysToExam });
}

import { NextResponse } from "next/server";
import { getCalendar } from "@/lib/calendar.js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }
  const events = await getCalendar(start, end);
  return NextResponse.json({ events });
}

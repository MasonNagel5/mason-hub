import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/calendar.js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const hours = Number(searchParams.get("hours")) || 48;
  const events = await getUpcomingEvents(hours);
  return NextResponse.json({ events });
}

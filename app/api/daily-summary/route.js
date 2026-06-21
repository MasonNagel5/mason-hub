import { NextResponse } from "next/server";
import { completedToday } from "@/lib/tasks.js";
import { writeDailySummary } from "@/lib/vault.js";

export async function POST() {
  const titles = completedToday();
  writeDailySummary(titles);
  return NextResponse.json({ ok: true, count: titles.length, titles });
}

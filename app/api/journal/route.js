import { NextResponse } from "next/server";
import { listItems, addItem, deleteItem } from "@/lib/store.js";
import { appendDailyNoteLine } from "@/lib/vault.js";
import { ymd } from "@/lib/dates.js";

export async function GET() {
  return NextResponse.json({ entries: listItems("journal").slice().reverse() });
}

export async function POST(req) {
  const { text, mood } = await req.json();
  if (!text || !text.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });
  const date = ymd();
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const row = addItem("journal", { date, time, text: text.trim(), mood: mood || null });
  // Mirror into the daily note so it lives in the brain.
  try {
    appendDailyNoteLine("Journal", `**${time}${mood ? ` · ${mood}` : ""}**\n${text.trim()}\n`, date);
  } catch {}
  return NextResponse.json({ ok: true, entry: row });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  deleteItem("journal", searchParams.get("id"));
  return NextResponse.json({ ok: true });
}

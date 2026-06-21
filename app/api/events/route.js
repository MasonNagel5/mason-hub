import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.js";

export async function GET() {
  const events = getDb().prepare("SELECT * FROM events ORDER BY start").all();
  return NextResponse.json({ events });
}

export async function POST(req) {
  const b = await req.json();
  if (!b.title?.trim() || !b.start) {
    return NextResponse.json({ error: "title and start required" }, { status: 400 });
  }
  const info = getDb()
    .prepare("INSERT INTO events (title, start, end, location, notes) VALUES (?, ?, ?, ?, ?)")
    .run(b.title.trim(), b.start, b.end || null, b.location || null, b.notes || null);
  return NextResponse.json({ id: info.lastInsertRowid });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  getDb().prepare("DELETE FROM events WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}

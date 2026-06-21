import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.js";

export async function GET() {
  const shifts = getDb().prepare("SELECT * FROM shifts ORDER BY recurring DESC, weekday, start").all();
  return NextResponse.json({ shifts });
}

export async function POST(req) {
  const b = await req.json();
  const db = getDb();
  const title = b.title?.trim() || "RA Shift";

  if (b.recurring) {
    // weekday (0-6) + start_time/end_time (HH:MM)
    const info = db
      .prepare(
        `INSERT INTO shifts (title, recurring, weekday, start_time, end_time, start, end, notes)
         VALUES (?, 1, ?, ?, ?, '', '', ?)`
      )
      .run(title, Number(b.weekday), b.start_time, b.end_time, b.notes || null);
    return NextResponse.json({ id: info.lastInsertRowid });
  }

  if (!b.start || !b.end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }
  const info = db
    .prepare("INSERT INTO shifts (title, recurring, start, end, notes) VALUES (?, 0, ?, ?, ?)")
    .run(title, b.start, b.end, b.notes || null);
  return NextResponse.json({ id: info.lastInsertRowid });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  getDb().prepare("DELETE FROM shifts WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}

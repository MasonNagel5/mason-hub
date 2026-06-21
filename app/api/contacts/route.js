import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.js";
import { listContacts, dailyContact } from "@/lib/contacts.js";
import { ymd } from "@/lib/dates.js";

export async function GET() {
  return NextResponse.json({ contacts: listContacts(), daily: dailyContact() });
}

export async function POST(req) {
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const info = getDb()
    .prepare("INSERT INTO contacts (name, org, role, notes) VALUES (?, ?, ?, ?)")
    .run(b.name.trim(), b.org || null, b.role || null, b.notes || null);
  return NextResponse.json({ id: info.lastInsertRowid });
}

export async function PATCH(req) {
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = getDb();
  if (b.markContacted) {
    db.prepare("UPDATE contacts SET last_contact = ? WHERE id = ?").run(ymd(), b.id);
  } else {
    db.prepare(
      "UPDATE contacts SET name = COALESCE(?, name), org = COALESCE(?, org), role = COALESCE(?, role), notes = COALESCE(?, notes), last_contact = COALESCE(?, last_contact) WHERE id = ?"
    ).run(b.name ?? null, b.org ?? null, b.role ?? null, b.notes ?? null, b.last_contact ?? null, b.id);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  getDb().prepare("DELETE FROM contacts WHERE id = ?").run(Number(searchParams.get("id")));
  return NextResponse.json({ ok: true });
}

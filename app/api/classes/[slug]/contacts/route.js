import { NextResponse } from "next/server";
import { classBySlug } from "@/lib/classes.js";
import { getDb } from "@/lib/db.js";

export async function GET(_req, { params }) {
  const { slug } = await params;
  if (!classBySlug(slug)) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const row = getDb().prepare("SELECT data FROM class_contacts WHERE class_slug = ?").get(slug);
  return NextResponse.json({ contacts: row ? JSON.parse(row.data) : {} });
}

export async function PUT(req, { params }) {
  const { slug } = await params;
  if (!classBySlug(slug)) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const data = await req.json();
  getDb()
    .prepare(
      "INSERT INTO class_contacts (class_slug, data) VALUES (?, ?) ON CONFLICT(class_slug) DO UPDATE SET data = excluded.data"
    )
    .run(slug, JSON.stringify(data));
  return NextResponse.json({ ok: true });
}

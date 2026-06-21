import { NextResponse } from "next/server";
import { classBySlug } from "@/lib/classes.js";
import { readClassNotes, writeClassNotes } from "@/lib/vault.js";

export async function GET(_req, { params }) {
  const { slug } = await params;
  const cls = classBySlug(slug);
  if (!cls) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  return NextResponse.json({ content: readClassNotes(cls.name) });
}

export async function PUT(req, { params }) {
  const { slug } = await params;
  const cls = classBySlug(slug);
  if (!cls) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const { content } = await req.json();
  writeClassNotes(cls.name, content ?? "");
  return NextResponse.json({ ok: true });
}

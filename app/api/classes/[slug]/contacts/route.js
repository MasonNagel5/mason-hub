import { NextResponse } from "next/server";
import { classBySlug } from "@/lib/classes.js";
import { readStore, writeStore } from "@/lib/store.js";

// Per-class key contacts, stored in the vault (class_contacts.json keyed by slug).
const COL = "class_contacts";

export async function GET(_req, { params }) {
  const { slug } = await params;
  if (!classBySlug(slug)) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const all = readStore(COL, {});
  return NextResponse.json({ contacts: all[slug] || {} });
}

export async function PUT(req, { params }) {
  const { slug } = await params;
  if (!classBySlug(slug)) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const data = await req.json();
  const all = readStore(COL, {});
  all[slug] = data;
  writeStore(COL, all);
  return NextResponse.json({ ok: true });
}

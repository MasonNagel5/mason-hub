import { NextResponse } from "next/server";
import { classBySlug } from "@/lib/classes.js";
import { listResources, addResource, deleteResource, seedResources, hasSeed } from "@/lib/classResources.js";

export async function GET(_req, { params }) {
  const { slug } = await params;
  if (!classBySlug(slug)) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  return NextResponse.json({ resources: listResources(slug), canSeed: hasSeed(slug) });
}

export async function POST(req, { params }) {
  const { slug } = await params;
  if (!classBySlug(slug)) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const b = await req.json();
  if (b.seed) {
    const added = seedResources(slug);
    return NextResponse.json({ ok: true, added, resources: listResources(slug) });
  }
  if (!b.label?.trim()) return NextResponse.json({ error: "label required" }, { status: 400 });
  addResource({ classSlug: slug, label: b.label, url: b.url, kind: b.kind, notes: b.notes });
  return NextResponse.json({ ok: true, resources: listResources(slug) });
}

export async function DELETE(req, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  deleteResource(searchParams.get("id"));
  return NextResponse.json({ ok: true, resources: listResources(slug) });
}

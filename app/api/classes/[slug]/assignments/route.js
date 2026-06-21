import { NextResponse } from "next/server";
import { classBySlug } from "@/lib/classes.js";
import { listAssignments, addAssignment, updateAssignment, deleteAssignment } from "@/lib/assignments.js";

export async function GET(_req, { params }) {
  const { slug } = await params;
  if (!classBySlug(slug)) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  return NextResponse.json({ assignments: listAssignments(slug) });
}

export async function POST(req, { params }) {
  const { slug } = await params;
  if (!classBySlug(slug)) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const id = addAssignment({ classSlug: slug, name: b.name, due: b.due, status: b.status, points: b.points, notes: b.notes, type: b.type });
  return NextResponse.json({ ok: true, id, assignments: listAssignments(slug) });
}

export async function PATCH(req, { params }) {
  const { slug } = await params;
  if (!classBySlug(slug)) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  updateAssignment(b.id, b);
  return NextResponse.json({ ok: true, assignments: listAssignments(slug) });
}

export async function DELETE(req, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  deleteAssignment(searchParams.get("id"));
  return NextResponse.json({ ok: true, assignments: listAssignments(slug) });
}

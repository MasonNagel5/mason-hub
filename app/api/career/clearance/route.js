import { NextResponse } from "next/server";
import { listClearance, addClearanceItem, setClearanceDone, deleteClearanceItem } from "@/lib/career.js";

export async function GET() {
  return NextResponse.json({ items: listClearance() });
}
export async function POST(req) {
  const b = await req.json();
  if (!b.label?.trim()) return NextResponse.json({ error: "label required" }, { status: 400 });
  addClearanceItem(b.category, b.label);
  return NextResponse.json({ ok: true, items: listClearance() });
}
export async function PATCH(req) {
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  setClearanceDone(Number(b.id), !!b.done);
  return NextResponse.json({ ok: true, items: listClearance() });
}
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  deleteClearanceItem(Number(searchParams.get("id")));
  return NextResponse.json({ ok: true, items: listClearance() });
}

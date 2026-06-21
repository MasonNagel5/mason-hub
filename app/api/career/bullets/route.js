import { NextResponse } from "next/server";
import { listBullets, addBullet, updateBullet, deleteBullet } from "@/lib/career.js";

export async function GET() {
  return NextResponse.json({ bullets: listBullets() });
}
export async function POST(req) {
  const b = await req.json();
  addBullet(b);
  return NextResponse.json({ ok: true, bullets: listBullets() });
}
export async function PATCH(req) {
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  updateBullet(Number(b.id), b);
  return NextResponse.json({ ok: true, bullets: listBullets() });
}
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  deleteBullet(Number(searchParams.get("id")));
  return NextResponse.json({ ok: true, bullets: listBullets() });
}

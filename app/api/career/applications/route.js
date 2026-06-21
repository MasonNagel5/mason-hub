import { NextResponse } from "next/server";
import { listApplications, addApplication, updateApplication, deleteApplication } from "@/lib/career.js";

export async function GET() {
  return NextResponse.json({ applications: listApplications() });
}
export async function POST(req) {
  const b = await req.json();
  if (!b.agency?.trim()) return NextResponse.json({ error: "agency required" }, { status: 400 });
  addApplication(b);
  return NextResponse.json({ ok: true, applications: listApplications() });
}
export async function PATCH(req) {
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  updateApplication(Number(b.id), b);
  return NextResponse.json({ ok: true, applications: listApplications() });
}
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  deleteApplication(Number(searchParams.get("id")));
  return NextResponse.json({ ok: true, applications: listApplications() });
}

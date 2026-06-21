import { NextResponse } from "next/server";
import { addWeight, listWeights, deleteWeight } from "@/lib/gym.js";

export async function GET() {
  return NextResponse.json({ weights: listWeights() });
}

export async function POST(req) {
  const b = await req.json();
  const w = Number(b.weight);
  if (!Number.isFinite(w) || w <= 0) {
    return NextResponse.json({ error: "valid weight required" }, { status: 400 });
  }
  const weights = addWeight(b.date, w);
  return NextResponse.json({ ok: true, weights });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  deleteWeight(Number(searchParams.get("id")));
  return NextResponse.json({ ok: true });
}

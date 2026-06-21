import { NextResponse } from "next/server";
import { addSets, listSets, deleteSet, listExercises } from "@/lib/gym.js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const exercise = searchParams.get("exercise") || undefined;
  return NextResponse.json({ sets: listSets({ exercise }), exercises: listExercises() });
}

export async function POST(req) {
  const b = await req.json();
  if (!b.exercise?.trim()) {
    return NextResponse.json({ error: "exercise required" }, { status: 400 });
  }
  const sets = Array.isArray(b.sets) ? b.sets : [];
  if (sets.length === 0) {
    return NextResponse.json({ error: "at least one set required" }, { status: 400 });
  }
  addSets({ date: b.date, exercise: b.exercise, sets, notes: b.notes });
  return NextResponse.json({ ok: true, exercises: listExercises() });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  deleteSet(Number(searchParams.get("id")));
  return NextResponse.json({ ok: true });
}

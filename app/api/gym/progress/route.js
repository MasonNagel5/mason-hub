import { NextResponse } from "next/server";
import { progress } from "@/lib/gym.js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const exercise = searchParams.get("exercise");
  if (!exercise) return NextResponse.json({ error: "exercise required" }, { status: 400 });
  return NextResponse.json({ exercise, series: progress(exercise) });
}

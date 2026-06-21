import { NextResponse } from "next/server";
import { review } from "@/lib/flashcards.js";

export async function POST(req) {
  const { cardId, grade } = await req.json();
  if (!cardId || !grade) return NextResponse.json({ error: "cardId and grade required" }, { status: 400 });
  const progress = review(cardId, grade);
  return NextResponse.json({ ok: true, progress });
}

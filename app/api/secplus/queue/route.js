import { NextResponse } from "next/server";
import { getQueue } from "@/lib/flashcards.js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain") || undefined;
  const limit = Number(searchParams.get("limit")) || 20;
  return NextResponse.json({ cards: getQueue({ domain, limit }) });
}

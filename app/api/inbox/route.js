import { NextResponse } from "next/server";
import { appendToInbox, readInbox } from "@/lib/vault.js";

export async function GET() {
  return NextResponse.json({ items: readInbox() });
}

export async function POST(req) {
  const { item } = await req.json();
  if (!item || !item.trim()) {
    return NextResponse.json({ error: "item required" }, { status: 400 });
  }
  appendToInbox(item.trim());
  return NextResponse.json({ ok: true, items: readInbox() });
}

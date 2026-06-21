import { NextResponse } from "next/server";
import { buildBriefing } from "@/lib/briefing.js";

export async function GET() {
  return NextResponse.json(buildBriefing());
}

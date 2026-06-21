import { NextResponse } from "next/server";
import { readProjects } from "@/lib/vault.js";

export async function GET() {
  return NextResponse.json({ projects: readProjects() });
}

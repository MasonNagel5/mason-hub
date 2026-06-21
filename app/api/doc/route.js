import { NextResponse } from "next/server";
import { readVaultFile, writeVaultFile } from "@/lib/vault.js";

// Read/write a single markdown doc inside the vault. Whitelisted keys map to
// real vault paths so workspace tabs (RA, Ambassador, SFS, Boeing) keep a
// human-readable note in the brain.
const DOCS = {
  ra: "20 - Areas/Resident Advisor/RA Workspace.md",
  ambassador: "20 - Areas/Student Ambassador/Ambassador Workspace.md",
  sfs: "10 - Projects/10.7 - SFS OPM Approval/SFS Workspace.md",
  boeing: "20 - Areas/Boeing Mentorship/Boeing Mentorship.md",
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!DOCS[key]) return NextResponse.json({ error: "unknown doc" }, { status: 404 });
  return NextResponse.json({ content: readVaultFile(DOCS[key]), path: DOCS[key] });
}

export async function PUT(req) {
  const { key, content } = await req.json();
  if (!DOCS[key]) return NextResponse.json({ error: "unknown doc" }, { status: 404 });
  writeVaultFile(DOCS[key], content ?? "");
  return NextResponse.json({ ok: true });
}

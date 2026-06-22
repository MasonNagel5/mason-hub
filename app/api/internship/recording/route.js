import { NextResponse } from "next/server";
import { saveInternshipRecording } from "@/lib/vault.js";

// Accept an audio blob (multipart form-data, field "file") and save it into the
// vault's Internship/Recordings folder so it lands in the second brain.
export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  const name = (form.get("name") || file.name || "internship-audio.webm").toString();
  const buffer = Buffer.from(await file.arrayBuffer());
  const relPath = saveInternshipRecording(name, buffer);
  return NextResponse.json({ relPath, fileName: relPath.split(/[\\/]/).pop() });
}

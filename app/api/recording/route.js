import { NextResponse } from "next/server";
import { saveRecording } from "@/lib/vault.js";

// Accept an audio blob (multipart form-data: "file", "feature") and save it into
// that feature's vault folder so it lands in the second brain.
export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");
  const feature = (form.get("feature") || "").toString();
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  const name = (form.get("name") || file.name || `${feature || "audio"}.webm`).toString();
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const relPath = saveRecording(feature, name, buffer);
    return NextResponse.json({ relPath, fileName: relPath.split(/[\\/]/).pop() });
  } catch (e) {
    return NextResponse.json({ error: e.message || "save failed" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { classBySlug } from "@/lib/classes.js";
import { listTranscripts, saveTranscript } from "@/lib/vault.js";

export async function GET(_req, { params }) {
  const { slug } = await params;
  const cls = classBySlug(slug);
  if (!cls) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  return NextResponse.json({ transcripts: listTranscripts(cls.name) });
}

// Save a transcript captured in the browser (Web Speech API) as a vault markdown file.
export async function POST(req, { params }) {
  const { slug } = await params;
  const cls = classBySlug(slug);
  if (!cls) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const { title, text } = await req.json();
  if (!text || !text.trim()) return NextResponse.json({ error: "empty transcript" }, { status: 400 });
  const { fileName } = saveTranscript(cls.name, (title || "Lecture").trim(), text.trim());
  return NextResponse.json({ ok: true, fileName });
}

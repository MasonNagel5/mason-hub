import { NextResponse } from "next/server";
import { classBySlug } from "@/lib/classes.js";
import { listTranscripts, saveTranscript } from "@/lib/vault.js";
import { getDb } from "@/lib/db.js";

export async function GET(_req, { params }) {
  const { slug } = await params;
  const cls = classBySlug(slug);
  if (!cls) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  return NextResponse.json({ transcripts: listTranscripts(cls.name) });
}

// Save a transcript captured in the browser (Web Speech API) as markdown.
export async function POST(req, { params }) {
  const { slug } = await params;
  const cls = classBySlug(slug);
  if (!cls) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  const { title, text } = await req.json();
  if (!text || !text.trim()) return NextResponse.json({ error: "empty transcript" }, { status: 400 });
  const label = (title || "Lecture").trim();
  const { fileName } = saveTranscript(cls.name, label, text.trim());
  getDb()
    .prepare("INSERT INTO transcripts (class_slug, title, file_path, text) VALUES (?, ?, ?, ?)")
    .run(slug, label, fileName, text.trim());
  return NextResponse.json({ ok: true, fileName });
}

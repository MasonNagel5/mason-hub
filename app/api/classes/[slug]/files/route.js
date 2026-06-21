import { NextResponse } from "next/server";
import { classBySlug } from "@/lib/classes.js";
import { listClassFiles, saveClassFile } from "@/lib/vault.js";

export async function GET(_req, { params }) {
  const { slug } = await params;
  const cls = classBySlug(slug);
  if (!cls) return NextResponse.json({ error: "unknown class" }, { status: 404 });
  return NextResponse.json({ files: listClassFiles(cls.name) });
}

export async function POST(req, { params }) {
  const { slug } = await params;
  const cls = classBySlug(slug);
  if (!cls) return NextResponse.json({ error: "unknown class" }, { status: 404 });

  const form = await req.formData();
  const files = form.getAll("file");
  if (!files.length) return NextResponse.json({ error: "no files" }, { status: 400 });

  const saved = [];
  for (const f of files) {
    if (typeof f === "string") continue;
    const buf = Buffer.from(await f.arrayBuffer());
    saveClassFile(cls.name, f.name, buf);
    saved.push(f.name);
  }
  return NextResponse.json({ ok: true, saved, files: listClassFiles(cls.name) });
}

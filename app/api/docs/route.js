import { NextResponse } from "next/server";
import { listPersonalDocs, savePersonalDoc, deletePersonalDoc } from "@/lib/vault.js";

export async function GET() {
  return NextResponse.json({ files: listPersonalDocs() });
}

export async function POST(req) {
  const form = await req.formData();
  const files = form.getAll("file");
  const saved = [];
  for (const f of files) {
    if (typeof f === "string") continue;
    savePersonalDoc(f.name, Buffer.from(await f.arrayBuffer()));
    saved.push(f.name);
  }
  return NextResponse.json({ ok: true, saved, files: listPersonalDocs() });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  deletePersonalDoc(searchParams.get("name"));
  return NextResponse.json({ ok: true, files: listPersonalDocs() });
}

import { NextResponse } from "next/server";
import { listItems, addItem, updateItem, deleteItem, replaceAll } from "@/lib/store.js";
import { writeNetworkingMirror, writeNotesMirror } from "@/lib/mirror.js";

// Note collections that mirror to an Obsidian markdown file, keyed to a feature.
const NOTES_FEATURES = { internship_notes: "internship", boeing_notes: "boeing" };

// Collections that keep a human-readable markdown mirror in the vault for Cowork.
function mirror(name) {
  if (name === "networking") {
    try { writeNetworkingMirror(); } catch {}
  } else if (NOTES_FEATURES[name]) {
    try { writeNotesMirror(NOTES_FEATURES[name]); } catch {}
  }
}

// Generic vault-backed collection API. Whitelisted names only.
const ALLOWED = new Set([
  "jobs",
  "networking",
  "journal",
  "budget",
  "weight",
  "ra_ideas",
  "ambassador_log",
  "sfs_checklist",
  "boeing_meetings",
  "resume_bullets",
  "gpa_plan",
  "internship_notes",
  "boeing_notes",
]);

function ok(name) {
  return ALLOWED.has(name);
}

export async function GET(_req, { params }) {
  const { name } = await params;
  if (!ok(name)) return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  return NextResponse.json({ items: listItems(name) });
}

export async function POST(req, { params }) {
  const { name } = await params;
  if (!ok(name)) return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  const body = await req.json();
  if (Array.isArray(body.replaceAll)) {
    replaceAll(name, body.replaceAll);
    mirror(name);
    return NextResponse.json({ items: listItems(name) });
  }
  const row = addItem(name, body.item || body);
  mirror(name);
  return NextResponse.json({ item: row, items: listItems(name) });
}

export async function PATCH(req, { params }) {
  const { name } = await params;
  if (!ok(name)) return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  const { id, patch } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  updateItem(name, id, patch || {});
  mirror(name);
  return NextResponse.json({ items: listItems(name) });
}

export async function DELETE(req, { params }) {
  const { name } = await params;
  if (!ok(name)) return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  deleteItem(name, searchParams.get("id"));
  mirror(name);
  return NextResponse.json({ items: listItems(name) });
}

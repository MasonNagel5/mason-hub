import { classBySlug } from "@/lib/classes.js";
import { classFilePath } from "@/lib/vault.js";
import fs from "node:fs";

const TYPES = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
};

export async function GET(_req, { params }) {
  const { slug, name } = await params;
  const cls = classBySlug(slug);
  if (!cls) return new Response("unknown class", { status: 404 });
  const decoded = decodeURIComponent(name);
  const p = classFilePath(cls.name, decoded);
  if (!fs.existsSync(p)) return new Response("not found", { status: 404 });
  const ext = decoded.split(".").pop().toLowerCase();
  const data = fs.readFileSync(p);
  return new Response(data, {
    headers: {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Content-Disposition": `inline; filename="${decoded}"`,
    },
  });
}

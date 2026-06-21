import { personalDocPath } from "@/lib/vault.js";
import fs from "node:fs";

const TYPES = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", txt: "text/plain; charset=utf-8", md: "text/markdown; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(_req, { params }) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const p = personalDocPath(decoded);
  if (!fs.existsSync(p)) return new Response("not found", { status: 404 });
  const ext = decoded.split(".").pop().toLowerCase();
  return new Response(fs.readFileSync(p), {
    headers: { "Content-Type": TYPES[ext] || "application/octet-stream", "Content-Disposition": `inline; filename="${decoded}"` },
  });
}

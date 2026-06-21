"use client";

import { useState } from "react";
import Tracker from "../components/Tracker";
import { store } from "../lib/client";

const COLUMNS = [
  { key: "order", label: "#", type: "number", width: 44 },
  { key: "company", label: "Company / Agency", type: "text", width: 180 },
  { key: "role", label: "Role", type: "text", width: 180 },
  { key: "type", label: "Type", type: "select", options: ["Internship", "Co-op", "Full-time", "Fellowship"], width: 110 },
  { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"], width: 100 },
  { key: "status", label: "Status", type: "select", options: ["Researching", "To apply", "Applied", "OA/Assessment", "Interview", "Offer", "Accepted", "Rejected"], width: 130 },
  { key: "deadline", label: "Deadline", type: "date", width: 140 },
  { key: "link", label: "Link", type: "url", width: 70 },
  { key: "notes", label: "Notes", type: "text", width: 220 },
];

const STATUS_COLORS = {
  Researching: "var(--color-muted)", "To apply": "var(--color-yellow)", Applied: "var(--color-accent)",
  "OA/Assessment": "var(--color-accent)", Interview: "var(--color-yellow)", Offer: "var(--color-green)",
  Accepted: "var(--color-green)", Rejected: "var(--color-red)",
};

export default function JobsPage() {
  const [importing, setImporting] = useState(false);
  const [md, setMd] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [msg, setMsg] = useState(null);

  async function doImport(mode) {
    const rows = parseMarkdown(md);
    if (!rows.length) { setMsg("Couldn't find any rows. Paste a markdown table or '- ' list."); return; }
    let existing = [];
    if (mode === "append") { try { existing = await store.list("jobs"); } catch {} }
    const base = existing.length;
    const merged = [
      ...existing,
      ...rows.map((r, i) => ({ id: Date.now().toString(36) + i, createdAt: new Date().toISOString(), order: r.order ?? base + i + 1, ...r })),
    ];
    await store.replace("jobs", merged);
    setImporting(false); setMd(""); setMsg(`Imported ${rows.length} jobs.`);
    setReloadKey((k) => k + 1);
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 className="page-title">🏛 Job Tracker</h2>
          <p className="page-sub">Every target in priority order. Click a header to sort; edit any cell inline — it saves to your vault.</p>
        </div>
        <button className="btn btn-accent" onClick={() => setImporting(true)}>⇪ Import from markdown</button>
      </div>
      {msg && <div className="card" style={{ padding: 8, marginBottom: 12, fontSize: 13, color: "var(--color-green)", borderColor: "var(--color-green)" }}>{msg}</div>}

      <Tracker key={reloadKey} collection="jobs" columns={COLUMNS} defaultSort={{ key: "order", dir: "asc" }} statusColors={STATUS_COLORS}
        emptyHint="No jobs yet. Use “Import from markdown” to paste your researched list (Cowork can generate it), or add rows manually." />

      {importing && (
        <div className="modal-overlay" onClick={() => setImporting(false)}>
          <div className="card" style={{ width: 640, maxWidth: "100%", padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Import jobs from markdown</h3>
            <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 0 }}>
              Paste a markdown table with headers like <code>Company | Role | Type | Priority | Deadline | Link | Notes</code>,
              or a simple <code>- Company — Role</code> list. Order is taken from row position.
            </p>
            <textarea className="input" rows={12} value={md} onChange={(e) => setMd(e.target.value)} placeholder={"| # | Company | Role | Priority | Deadline |\n| - | - | - | - | - |\n| 1 | PNNL | Cybersecurity Intern | High | 2026-09-01 |"} style={{ fontFamily: "monospace", fontSize: 12 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn" onClick={() => setImporting(false)}>Cancel</button>
              <button className="btn" onClick={() => doImport("append")}>Append</button>
              <button className="btn btn-accent" onClick={() => doImport("replace")}>Replace all</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Parse a markdown table or bullet list into job rows.
function parseMarkdown(md) {
  const lines = md.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = [];
  const tableRows = lines.filter((l) => l.startsWith("|"));
  if (tableRows.length >= 2) {
    const headers = tableRows[0].split("|").map((s) => s.trim().toLowerCase()).filter(Boolean);
    for (let i = 1; i < tableRows.length; i++) {
      if (/^\|?\s*:?-{2,}/.test(tableRows[i])) continue; // separator
      const cells = tableRows[i].split("|").map((s) => s.trim());
      const filled = cells.filter((_, idx) => idx > 0 && idx <= headers.length).slice(0, headers.length);
      if (filled.every((c) => !c)) continue;
      const row = {};
      headers.forEach((h, idx) => { mapField(row, h, filled[idx] || ""); });
      if (row.company || row.role) rows.push(row);
    }
    return rows;
  }
  // bullet list fallback: "- Company — Role" or "1. Company - Role"
  for (const l of lines) {
    const m = l.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (!m) continue;
    const parts = m[1].split(/—|–| - /);
    rows.push({ company: (parts[0] || "").trim(), role: (parts[1] || "").trim() });
  }
  return rows;
}

function mapField(row, header, value) {
  const h = header.replace(/[^a-z]/g, "");
  if (["company", "agency", "employer", "org", "organization"].includes(h)) row.company = value;
  else if (["role", "title", "position"].includes(h)) row.role = value;
  else if (["type"].includes(h)) row.type = value;
  else if (["priority", "tier"].includes(h)) row.priority = value;
  else if (["status"].includes(h)) row.status = value;
  else if (["deadline", "due", "close", "closes"].includes(h)) row.deadline = value;
  else if (["link", "url", "apply"].includes(h)) row.link = value;
  else if (["order", "rank", "n", "no"].includes(h)) row.order = Number(value) || undefined;
  else if (["notes", "note", "comments"].includes(h)) row.notes = value;
}

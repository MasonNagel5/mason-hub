"use client";

import { useState } from "react";
import Tracker from "../components/Tracker";
import { api, store } from "../lib/client";

const COLUMNS = [
  { key: "name", label: "Name", type: "text", width: 160 },
  { key: "org", label: "Org", type: "text", width: 150 },
  { key: "role", label: "Role", type: "text", width: 150 },
  { key: "status", label: "Status", type: "select", options: ["To reach out", "Contacted", "Connected", "Applied", "Interviewing", "Offer", "Accepted", "Rejected"], width: 130 },
  { key: "channel", label: "Channel", type: "select", options: ["LinkedIn", "Email", "Referral", "Event", "Other"], width: 110 },
  { key: "lastContact", label: "Last contact", type: "date", width: 140 },
  { key: "notes", label: "Notes", type: "text", width: 240 },
];

const STATUS_COLORS = {
  "To reach out": "var(--color-yellow)", Contacted: "var(--color-accent)", Connected: "var(--color-green)",
  Applied: "var(--color-accent)", Interviewing: "var(--color-yellow)", Offer: "var(--color-green)",
  Accepted: "var(--color-green)", Rejected: "var(--color-red)",
};

export default function NetworkingPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [md, setMd] = useState("");

  async function importRoster() {
    setBusy(true);
    try {
      const r = await api("/api/networking/import", { method: "POST", body: JSON.stringify({}) });
      setMsg(`Imported ${r.added} new contacts (parsed ${r.parsed}).`);
      setReloadKey((k) => k + 1);
    } catch (e) { setMsg("Import failed: " + e.message); }
    finally { setBusy(false); setTimeout(() => setMsg(null), 4000); }
  }

  async function doImport(mode) {
    const rows = parseMarkdown(md);
    if (!rows.length) { setMsg("Couldn't find any rows. Paste a markdown table or '- ' list."); return; }
    let existing = [];
    if (mode === "append") { try { existing = await store.list("networking"); } catch {} }
    const merged = [
      ...existing,
      ...rows.map((r, i) => ({
        id: Date.now().toString(36) + i, createdAt: new Date().toISOString(),
        name: r.name || "", org: r.org || "", role: r.role || "",
        status: r.status || "Connected", channel: r.channel || "LinkedIn",
        lastContact: r.lastContact || "", notes: r.notes || "",
      })),
    ];
    await store.replace("networking", merged);
    setImporting(false); setMd(""); setMsg(`Imported ${rows.length} contacts.`);
    setReloadKey((k) => k + 1);
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 className="page-title">🤝 Networking</h2>
          <p className="page-sub">Turn connections into relationships. Track every outreach and follow-up. Saves to your vault.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={importRoster} disabled={busy}>{busy ? "Importing…" : "⇪ Import 6/20 roster"}</button>
          <button className="btn btn-accent" onClick={() => setImporting(true)}>⇪ Import from markdown</button>
        </div>
      </div>
      {msg && <div className="card" style={{ padding: 8, marginBottom: 12, fontSize: 13, color: "var(--color-green)", borderColor: "var(--color-green)" }}>{msg}</div>}
      <Tracker key={reloadKey} collection="networking" columns={COLUMNS} defaultSort={{ key: "status", dir: "asc" }} statusColors={STATUS_COLORS}
        quickSorts={[{ label: "⏱ Recent contact", key: "lastContact", dir: "desc" }, { label: "◷ Status", key: "status", dir: "asc" }]}
        emptyHint="No contacts yet. Import your LinkedIn roster from the 6/20 note, paste a markdown list, or add rows manually." />

      {importing && (
        <div className="modal-overlay" onClick={() => setImporting(false)}>
          <div className="card" style={{ width: 640, maxWidth: "100%", padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Import contacts from markdown</h3>
            <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 0 }}>
              Paste a markdown table with headers like <code>Name | Org | Role | Status | Channel | Last contact | Notes</code>,
              or a simple <code>- Name - Org</code> list. Blank status defaults to <code>Connected</code>.
            </p>
            <textarea className="input" rows={12} value={md} onChange={(e) => setMd(e.target.value)} placeholder={"| Name | Org | Role | Status |\n| - | - | - | - |\n| Jane Doe | PNNL | Recruiter | Connected |"} style={{ fontFamily: "monospace", fontSize: 12 }} />
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

// Parse a markdown table or bullet list into contact rows.
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
      if (row.name || row.org) rows.push(row);
    }
    return rows;
  }
  // Tab-separated table (e.g. a rendered table copy/pasted, losing the | bars).
  const tsvRows = lines.filter((l) => l.includes("\t"));
  if (tsvRows.length >= 2) {
    const headers = tsvRows[0].split("\t").map((s) => s.trim().toLowerCase());
    for (let i = 1; i < tsvRows.length; i++) {
      const cells = tsvRows[i].split("\t").map((s) => s.trim());
      if (/^-{2,}$/.test(cells[0]) || cells.every((c) => !c)) continue;
      const row = {};
      headers.forEach((h, idx) => { mapField(row, h, cells[idx] || ""); });
      if (row.name || row.org) rows.push(row);
    }
    if (rows.length) return rows;
  }
  // bullet list fallback: "- Name - Org" or "1. Name - Org"
  for (const l of lines) {
    const m = l.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (!m) continue;
    const parts = m[1].split(/-|–| - /);
    rows.push({ name: (parts[0] || "").trim(), org: (parts[1] || "").trim() });
  }
  return rows;
}

function mapField(row, header, value) {
  const h = header.replace(/[^a-z]/g, "");
  if (["name", "contact", "person", "fullname"].includes(h)) row.name = value;
  else if (["org", "organization", "company", "agency", "employer", "orgcompany"].includes(h)) row.org = value;
  else if (["role", "title", "position"].includes(h)) row.role = value;
  else if (["status", "stage"].includes(h)) row.status = value;
  else if (["channel", "source", "via", "platform"].includes(h)) row.channel = value;
  else if (["lastcontact", "last", "date", "contacted", "lastcontacted", "lastreached"].includes(h)) row.lastContact = value;
  else if (["notes", "note", "comments", "comment"].includes(h)) row.notes = value;
}

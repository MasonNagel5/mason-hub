"use client";

import { useState } from "react";
import Tracker from "../components/Tracker";
import { api } from "../lib/client";

const COLUMNS = [
  { key: "name", label: "Name", type: "text", width: 160 },
  { key: "org", label: "Org", type: "text", width: 150 },
  { key: "role", label: "Role", type: "text", width: 150 },
  { key: "status", label: "Status", type: "select", options: ["To reach out", "Contacted", "Replied", "Meeting set", "Connected", "Cold"], width: 130 },
  { key: "channel", label: "Channel", type: "select", options: ["LinkedIn", "Email", "Referral", "Event", "Other"], width: 110 },
  { key: "lastContact", label: "Last contact", type: "date", width: 140 },
  { key: "notes", label: "Notes", type: "text", width: 240 },
];

const STATUS_COLORS = {
  "To reach out": "var(--color-yellow)", Contacted: "var(--color-accent)", Replied: "var(--color-green)",
  "Meeting set": "var(--color-green)", Connected: "var(--color-green)", Cold: "var(--color-muted)",
};

export default function NetworkingPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function importRoster() {
    setBusy(true);
    try {
      const r = await api("/api/networking/import", { method: "POST", body: JSON.stringify({}) });
      setMsg(`Imported ${r.added} new contacts (parsed ${r.parsed}).`);
      setReloadKey((k) => k + 1);
    } catch (e) { setMsg("Import failed: " + e.message); }
    finally { setBusy(false); setTimeout(() => setMsg(null), 4000); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 className="page-title">🤝 Networking</h2>
          <p className="page-sub">Turn connections into relationships. Track every outreach and follow-up. Saves to your vault.</p>
        </div>
        <button className="btn" onClick={importRoster} disabled={busy}>{busy ? "Importing…" : "⇪ Import 6/20 roster"}</button>
      </div>
      {msg && <div className="card" style={{ padding: 8, marginBottom: 12, fontSize: 13, color: "var(--color-green)", borderColor: "var(--color-green)" }}>{msg}</div>}
      <Tracker key={reloadKey} collection="networking" columns={COLUMNS} defaultSort={{ key: "status", dir: "asc" }} statusColors={STATUS_COLORS}
        emptyHint="No contacts yet. Import your LinkedIn roster from the 6/20 note, or add rows manually." />
    </div>
  );
}

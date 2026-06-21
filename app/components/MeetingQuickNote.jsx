"use client";

import { useState } from "react";
import { api } from "../lib/client";

const TYPES = ["RA meeting", "Internship check-in", "Mentorship session", "Other"];

export default function MeetingQuickNote() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(TYPES[0]);
  const [custom, setCustom] = useState("");
  const [attendees, setAttendees] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const title = type === "Other" ? custom || "Meeting" : type;
    try {
      const r = await api("/api/meeting-notes", { method: "POST", body: JSON.stringify({ title, re: title, attendees }) });
      setResult(r.relPath);
    } catch (e) {
      setResult("Error: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button className="btn" onClick={() => { setOpen((o) => !o); setResult(null); }}>📝 Meeting note</button>
      {open && (
        <div className="card" style={{ position: "absolute", right: 0, top: "110%", width: 280, padding: 14, zIndex: 50 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>New meeting note</div>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)} style={{ marginBottom: 8 }}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {type === "Other" && <input className="input" placeholder="Title" value={custom} onChange={(e) => setCustom(e.target.value)} style={{ marginBottom: 8 }} />}
          <input className="input" placeholder="Attendees (comma separated)" value={attendees} onChange={(e) => setAttendees(e.target.value)} style={{ marginBottom: 8 }} />
          <button className="btn btn-accent" style={{ width: "100%" }} onClick={create} disabled={busy}>{busy ? "Creating…" : "Create in vault"}</button>
          {result && (
            <div style={{ fontSize: 11, color: result.startsWith("Error") ? "var(--color-red)" : "var(--color-green)", marginTop: 8, wordBreak: "break-all" }}>
              {result.startsWith("Error") ? result : `Saved: ${result}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

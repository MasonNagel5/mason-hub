"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/client";

const MOODS = ["", "🔥 Great", "🙂 Good", "😐 Meh", "😓 Rough"];

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() { try { setEntries((await api("/api/journal")).entries); } catch {} }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await api("/api/journal", { method: "POST", body: JSON.stringify({ text, mood }) });
      setText(""); setMood(""); load();
    } finally { setSaving(false); }
  }
  async function del(id) { await api(`/api/journal?id=${id}`, { method: "DELETE" }); load(); }

  const byDate = {};
  for (const e of entries) (byDate[e.date] ||= []).push(e);

  return (
    <div style={{ maxWidth: 760 }}>
      <h2 className="page-title">✍ Journal</h2>
      <p className="page-sub">Free-write whenever. Each entry is timestamped and mirrored into that day's note in your vault.</p>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <textarea className="input" rows={4} placeholder="What's on your mind today?" value={text} onChange={(e) => setText(e.target.value)} style={{ resize: "vertical", lineHeight: 1.6 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <select className="input" style={{ width: "auto" }} value={mood} onChange={(e) => setMood(e.target.value)}>
            {MOODS.map((m) => <option key={m} value={m}>{m || "Mood (optional)"}</option>)}
          </select>
          <button className="btn btn-accent" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save entry"}</button>
        </div>
      </div>

      {Object.keys(byDate).length === 0 ? (
        <div style={{ color: "var(--color-muted)", fontSize: 13 }}>No entries yet.</div>
      ) : (
        Object.entries(byDate).map(([date, list]) => (
          <div key={date} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              {new Date(date + "T12:00").toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </div>
            {list.map((e) => (
              <div key={e.id} className="card" style={{ padding: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-muted)", marginBottom: 6 }}>
                  <span>{e.time}{e.mood ? ` · ${e.mood}` : ""}</span>
                  <button className="btn" style={{ padding: "1px 6px", fontSize: 11 }} onClick={() => del(e.id)}>✕</button>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.text}</div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/client";
import { fmtTime, ymd } from "@/lib/dates.js";

export default function Exams({ slug }) {
  const [exams, setExams] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState(ymd());
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      const { assignments } = await api(`/api/classes/${slug}/assignments`);
      setExams(assignments.filter((a) => a.type === "exam"));
    } catch {}
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function add() {
    if (!name.trim()) return;
    const due = new Date(`${date}T${time || "10:00"}`).toISOString();
    await api(`/api/classes/${slug}/assignments`, { method: "POST", body: JSON.stringify({ name, due, notes, type: "exam" }) });
    setName("");
    setNotes("");
    setAdding(false);
    load();
  }
  async function markDone(id) {
    await api(`/api/classes/${slug}/assignments`, { method: "PATCH", body: JSON.stringify({ id, status: "submitted" }) });
    load();
  }
  async function remove(id) {
    await api(`/api/classes/${slug}/assignments?id=${id}`, { method: "DELETE" });
    load();
  }

  const upcoming = exams
    .filter((e) => e.status !== "submitted")
    .sort((a, b) => new Date(a.due) - new Date(b.due));
  const past = exams.filter((e) => e.status === "submitted");

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>📝 Exams</h3>
        <button className="btn btn-accent" style={{ padding: "4px 10px" }} onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "+ Add exam"}
        </button>
      </div>

      {adding && (
        <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, padding: 12, marginBottom: 14 }}>
          <input className="input" placeholder="Exam name (e.g. Midterm 1)" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 8 }} autoFocus />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: 120 }} />
            <button className="btn btn-accent" onClick={add}>Save</button>
          </div>
          <input className="input" placeholder="Topics / format / notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ marginTop: 8 }} />
        </div>
      )}

      {upcoming.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>No upcoming exams. Add one to get a countdown.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {upcoming.map((e) => {
            const days = Math.ceil((new Date(e.due) - new Date()) / 86400000);
            const urgent = days <= 7;
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--color-bg)", border: `1px solid ${urgent ? "var(--color-red)" : "var(--color-border)"}`, borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ textAlign: "center", minWidth: 56 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: urgent ? "var(--color-red)" : "var(--color-accent)" }}>{days}</div>
                  <div style={{ fontSize: 10, color: "var(--color-muted)", textTransform: "uppercase" }}>{days === 1 ? "day" : "days"}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                    {new Date(e.due).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })} · {fmtTime(e.due)}
                  </div>
                  {e.notes && <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>{e.notes}</div>}
                </div>
                <button className="btn" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => markDone(e.id)}>Done</button>
                <button className="btn" style={{ padding: "3px 7px", fontSize: 11 }} onClick={() => remove(e.id)}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 6 }}>Past</div>
          {past.map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--color-muted)", padding: "3px 0" }}>
              <span style={{ textDecoration: "line-through" }}>{e.name}</span>
              <span>{new Date(e.due).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

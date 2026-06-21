"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/client";
import { fmtTime, ymd } from "@/lib/dates.js";

const STATUSES = ["upcoming", "submitted", "missing"];
const STATUS_COLOR = {
  submitted: "var(--color-green)",
  missing: "var(--color-red)",
  upcoming: "var(--color-accent)",
};

export default function Assignments({ slug }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState(ymd());
  const [dueTime, setDueTime] = useState("23:59");
  const [points, setPoints] = useState("");
  const [type, setType] = useState("assignment");

  async function load() {
    setLoading(true);
    try {
      // Exams live in their own tab; show everything else here.
      const all = (await api(`/api/classes/${slug}/assignments`)).assignments;
      setAssignments(all.filter((a) => a.type !== "exam"));
    } catch {}
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function add() {
    if (!name.trim()) return;
    const due = dueDate ? new Date(`${dueDate}T${dueTime || "23:59"}`).toISOString() : null;
    const r = await api(`/api/classes/${slug}/assignments`, {
      method: "POST",
      body: JSON.stringify({ name, due, points, type }),
    });
    setAssignments(r.assignments.filter((a) => a.type !== "exam"));
    setName("");
    setPoints("");
    setAdding(false);
  }
  async function setStatus(id, status) {
    const r = await api(`/api/classes/${slug}/assignments`, { method: "PATCH", body: JSON.stringify({ id, status }) });
    setAssignments(r.assignments.filter((a) => a.type !== "exam"));
  }
  async function remove(id) {
    const r = await api(`/api/classes/${slug}/assignments?id=${id}`, { method: "DELETE" });
    setAssignments(r.assignments.filter((a) => a.type !== "exam"));
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Assignments</h3>
        <button className="btn btn-accent" style={{ padding: "4px 10px" }} onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {adding && (
        <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, padding: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="input" placeholder="Assignment name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <select className="input" style={{ width: 130 }} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
              <option value="project">Project</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 3 }}>Due date</div>
              <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div style={{ width: 110 }}>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 3 }}>Time</div>
              <input className="input" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
            <div style={{ width: 80 }}>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 3 }}>Points</div>
              <input className="input" type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="—" />
            </div>
            <button className="btn btn-accent" onClick={add}>Save</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>Loading…</div>
      ) : assignments.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
          No assignments yet. Add them manually with “+ Add”. They’ll show on the Dashboard (due within 7 days) and the Calendar.
        </div>
      ) : (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "var(--color-muted)", fontSize: 11, textTransform: "uppercase" }}>
              <th style={{ textAlign: "left", padding: "4px 0" }}>Assignment</th>
              <th style={{ textAlign: "left" }}>Due</th>
              <th style={{ textAlign: "left" }}>Status</th>
              <th style={{ textAlign: "right" }}>Pts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => {
              const overdue = a.due && a.status === "upcoming" && new Date(a.due) < new Date();
              return (
                <tr key={a.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "6px 0" }}>{a.name}</td>
                  <td style={{ color: overdue ? "var(--color-red)" : "var(--color-muted)" }}>
                    {a.due ? `${new Date(a.due).toLocaleDateString([], { month: "short", day: "numeric" })} ${fmtTime(a.due)}` : "—"}
                  </td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => setStatus(a.id, e.target.value)}
                      className="input"
                      style={{ width: "auto", padding: "2px 6px", fontSize: 12, color: STATUS_COLOR[a.status], borderColor: STATUS_COLOR[a.status] }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} style={{ color: "var(--color-text)" }}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: "right", color: "var(--color-muted)" }}>{a.points ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => remove(a.id)}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

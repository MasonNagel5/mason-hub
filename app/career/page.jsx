"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/client";
import { ymd } from "@/lib/dates.js";

const SECTIONS = [
  { key: "apps", label: "🏛 Applications" },
  { key: "clearance", label: "🔐 Clearance Track" },
  { key: "bullets", label: "✍ Resume Bullets" },
  { key: "gpa", label: "📊 GPA Projector" },
];

export default function CareerPage() {
  const [section, setSection] = useState("apps");
  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 22 }}>💼 Career</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {SECTIONS.map((s) => (
          <button key={s.key} className={section === s.key ? "btn btn-accent" : "btn"} onClick={() => setSection(s.key)}>{s.label}</button>
        ))}
      </div>
      {section === "apps" && <Applications />}
      {section === "clearance" && <Clearance />}
      {section === "bullets" && <Bullets />}
      {section === "gpa" && <GPA />}
    </div>
  );
}

// ---------------- Applications ----------------
const STATUSES = ["interested", "applied", "interview", "offer", "accepted", "rejected"];
const STATUS_COLOR = { interested: "var(--color-muted)", applied: "var(--color-accent)", interview: "var(--color-yellow)", offer: "var(--color-green)", accepted: "var(--color-green)", rejected: "var(--color-red)" };

function Applications() {
  const [apps, setApps] = useState([]);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ agency: "", role: "", applied_date: "", deadline: "", next_action: "", url: "" });

  async function load() { try { setApps((await api("/api/career/applications")).applications); } catch {} }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!f.agency.trim()) return;
    const r = await api("/api/career/applications", { method: "POST", body: JSON.stringify(f) });
    setApps(r.applications); setF({ agency: "", role: "", applied_date: "", deadline: "", next_action: "", url: "" }); setAdding(false);
  }
  async function setStatus(id, status) { const r = await api("/api/career/applications", { method: "PATCH", body: JSON.stringify({ id, status }) }); setApps(r.applications); }
  async function remove(id) { const r = await api(`/api/career/applications?id=${id}`, { method: "DELETE" }); setApps(r.applications); }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Application tracker</h3>
        <button className="btn btn-accent" style={{ padding: "4px 10px" }} onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ Add"}</button>
      </div>
      {adding && (
        <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, padding: 12, marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="input" placeholder="Agency / org (e.g. PNNL, NSA)" value={f.agency} onChange={(e) => setF({ ...f, agency: e.target.value })} />
          <input className="input" placeholder="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
          <label style={{ fontSize: 11, color: "var(--color-muted)" }}>Applied<input className="input" type="date" value={f.applied_date} onChange={(e) => setF({ ...f, applied_date: e.target.value })} /></label>
          <label style={{ fontSize: 11, color: "var(--color-muted)" }}>Deadline<input className="input" type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></label>
          <input className="input" placeholder="Next action" value={f.next_action} onChange={(e) => setF({ ...f, next_action: e.target.value })} />
          <input className="input" placeholder="URL (USAJOBS link, etc.)" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
          <button className="btn btn-accent" style={{ gridColumn: "1 / -1" }} onClick={add}>Save</button>
        </div>
      )}
      {apps.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>No applications tracked yet. Add internships now, SFS placements later.</div>
      ) : (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead><tr style={{ color: "var(--color-muted)", fontSize: 11, textTransform: "uppercase" }}>
            <th style={{ textAlign: "left", padding: "4px 0" }}>Agency / Role</th><th style={{ textAlign: "left" }}>Status</th><th style={{ textAlign: "left" }}>Next action</th><th style={{ textAlign: "left" }}>Deadline</th><th></th>
          </tr></thead>
          <tbody>
            {apps.map((a) => {
              const overdue = a.deadline && new Date(a.deadline) < new Date() && !["accepted", "rejected"].includes(a.status);
              return (
                <tr key={a.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "6px 0" }}>
                    {a.url ? <a href={a.url} target="_blank" rel="noreferrer" style={{ color: "var(--color-text)" }}>{a.agency}</a> : a.agency}
                    {a.role && <span style={{ color: "var(--color-muted)" }}> · {a.role}</span>}
                  </td>
                  <td>
                    <select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)} className="input" style={{ width: "auto", padding: "2px 6px", fontSize: 12, color: STATUS_COLOR[a.status], borderColor: STATUS_COLOR[a.status] }}>
                      {STATUSES.map((s) => <option key={s} value={s} style={{ color: "var(--color-text)" }}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ color: "var(--color-muted)" }}>{a.next_action || "—"}</td>
                  <td style={{ color: overdue ? "var(--color-red)" : "var(--color-muted)" }}>{a.deadline || "—"}</td>
                  <td style={{ textAlign: "right" }}><button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => remove(a.id)}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------- Clearance ----------------
function Clearance() {
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState("");
  async function load() { try { setItems((await api("/api/career/clearance")).items); } catch {} }
  useEffect(() => { load(); }, []);
  async function toggle(it) { const r = await api("/api/career/clearance", { method: "PATCH", body: JSON.stringify({ id: it.id, done: !it.done }) }); setItems(r.items); }
  async function add() { if (!label.trim()) return; const r = await api("/api/career/clearance", { method: "POST", body: JSON.stringify({ label }) }); setItems(r.items); setLabel(""); }
  async function remove(id) { const r = await api(`/api/career/clearance?id=${id}`, { method: "DELETE" }); setItems(r.items); }

  const cats = [...new Set(items.map((i) => i.category))];
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Clearance-track checklist</h3>
        <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{doneCount}/{items.length} maintained</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 0 }}>Ongoing habits that quietly affect SF-86 / clearance eligibility. Keep these green.</p>
      {cats.map((cat) => (
        <div key={cat} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--color-accent)", marginBottom: 6 }}>{cat}</div>
          {items.filter((i) => i.category === cat).map((it) => (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", fontSize: 13 }}>
              <input type="checkbox" checked={!!it.done} onChange={() => toggle(it)} style={{ width: 16, height: 16, accentColor: "var(--color-green)", cursor: "pointer" }} />
              <span style={{ flex: 1, color: it.done ? "var(--color-muted)" : "var(--color-text)" }}>{it.label}</span>
              {!it.seeded && <button className="btn" style={{ padding: "1px 6px", fontSize: 11 }} onClick={() => remove(it.id)}>✕</button>}
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input className="input" placeholder="Add your own item…" value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn" onClick={add}>Add</button>
      </div>
    </div>
  );
}

// ---------------- Resume Bullets ----------------
function Bullets() {
  const [bullets, setBullets] = useState([]);
  const [f, setF] = useState({ raw: "", what: "", metric: "", method: "" });
  async function load() { try { setBullets((await api("/api/career/bullets")).bullets); } catch {} }
  useEffect(() => { load(); }, []);
  async function add() {
    if (!f.raw.trim() && !f.what.trim()) return;
    const r = await api("/api/career/bullets", { method: "POST", body: JSON.stringify(f) });
    setBullets(r.bullets); setF({ raw: "", what: "", metric: "", method: "" });
  }
  async function toggleReady(b) { const r = await api("/api/career/bullets", { method: "PATCH", body: JSON.stringify({ id: b.id, ready: !b.ready }) }); setBullets(r.bullets); }
  async function remove(id) { const r = await api(`/api/career/bullets?id=${id}`, { method: "DELETE" }); setBullets(r.bullets); }

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>Resume bullet builder <span style={{ color: "var(--color-muted)", fontWeight: 400, fontSize: 12 }}>(XYZ format)</span></h3>
      <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 0 }}>From the SWE internship. Drop a raw observation, then fill in the metric and method. Don't mark “ready” until it's real and defensible.</p>
      <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, padding: 12, marginBottom: 14 }}>
        <input className="input" placeholder="Raw observation (e.g. built an API endpoint that sped up load)" value={f.raw} onChange={(e) => setF({ ...f, raw: e.target.value })} style={{ marginBottom: 8 }} />
        <input className="input" placeholder="X — what you accomplished" value={f.what} onChange={(e) => setF({ ...f, what: e.target.value })} style={{ marginBottom: 6 }} />
        <input className="input" placeholder="Y — as measured by (the metric)" value={f.metric} onChange={(e) => setF({ ...f, metric: e.target.value })} style={{ marginBottom: 6 }} />
        <input className="input" placeholder="Z — by doing (the method/tech)" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} style={{ marginBottom: 8 }} />
        {(f.what) && <div style={{ fontSize: 13, color: "var(--color-green)", marginBottom: 8, fontStyle: "italic" }}>Preview: {preview(f)}</div>}
        <button className="btn btn-accent" onClick={add}>Save draft</button>
      </div>
      {bullets.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>No bullets yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bullets.map((b) => (
            <div key={b.id} style={{ border: `1px solid ${b.ready ? "var(--color-green)" : "var(--color-border)"}`, borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 13 }}>{b.xyz || b.raw}</div>
              {b.raw && b.xyz && <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 3 }}>raw: {b.raw}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <span className="tag" style={{ color: b.ready ? "var(--color-green)" : "var(--color-yellow)", borderColor: b.ready ? "var(--color-green)" : "var(--color-yellow)" }}>{b.ready ? "ready" : "not ready"}</span>
                <button className="btn" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => toggleReady(b)}>{b.ready ? "Mark not ready" : "Mark real & defensible"}</button>
                <button className="btn" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => remove(b.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function preview({ what, metric, method }) {
  const x = (what || "").trim().replace(/\.$/, "");
  if (!x) return "";
  let s = x;
  if (metric) s += `, as measured by ${metric.trim().replace(/\.$/, "")}`;
  if (method) s += `, by ${method.trim().replace(/\.$/, "")}`;
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

// ---------------- GPA projector ----------------
const GRADE_PTS = { "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2, "C-": 1.7, "D": 1, "F": 0 };
const FALL_COURSES = [
  { name: "CptS 327 — Crypto", credits: 3, grade: "A" },
  { name: "CptS 360 — Systems", credits: 4, grade: "A" },
  { name: "CptS 321 — OOSP", credits: 3, grade: "A" },
  { name: "CptS 302 — Prof Skills", credits: 3, grade: "A" },
  { name: "ENGL 402 — Tech Writing", credits: 3, grade: "A" },
];

function GPA() {
  const [currentGpa, setCurrentGpa] = useState(3.98);
  const [currentCredits, setCurrentCredits] = useState(60);
  const [courses, setCourses] = useState(FALL_COURSES);

  function setCourse(i, key, val) { setCourses((c) => c.map((x, j) => (j === i ? { ...x, [key]: val } : x))); }

  const semCredits = courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
  const semPts = courses.reduce((s, c) => s + (GRADE_PTS[c.grade] ?? 0) * (Number(c.credits) || 0), 0);
  const semGpa = semCredits ? semPts / semCredits : 0;
  const projected = (currentGpa * currentCredits + semPts) / (currentCredits + semCredits || 1);

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Semester GPA projector</h3>
      <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Current cumulative GPA
          <input className="input" type="number" step="0.01" value={currentGpa} onChange={(e) => setCurrentGpa(Number(e.target.value))} style={{ width: 100 }} />
        </label>
        <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Credits earned so far
          <input className="input" type="number" value={currentCredits} onChange={(e) => setCurrentCredits(Number(e.target.value))} style={{ width: 100 }} />
        </label>
      </div>
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 14 }}>
        <thead><tr style={{ color: "var(--color-muted)", fontSize: 11, textTransform: "uppercase" }}><th style={{ textAlign: "left" }}>Course</th><th>Credits</th><th>Expected</th></tr></thead>
        <tbody>
          {courses.map((c, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--color-border)" }}>
              <td style={{ padding: "5px 0" }}>{c.name}</td>
              <td style={{ textAlign: "center" }}><input className="input" type="number" value={c.credits} onChange={(e) => setCourse(i, "credits", e.target.value)} style={{ width: 56, textAlign: "center" }} /></td>
              <td style={{ textAlign: "center" }}>
                <select className="input" value={c.grade} onChange={(e) => setCourse(i, "grade", e.target.value)} style={{ width: 70 }}>
                  {Object.keys(GRADE_PTS).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 24 }}>
        <Stat label="This semester" value={semGpa.toFixed(3)} />
        <Stat label="Projected cumulative" value={projected.toFixed(3)} color={projected >= currentGpa ? "var(--color-green)" : "var(--color-red)"} />
        <Stat label="Change" value={`${projected - currentGpa >= 0 ? "+" : ""}${(projected - currentGpa).toFixed(3)}`} color={projected >= currentGpa ? "var(--color-green)" : "var(--color-red)"} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "var(--color-text)" }}>{value}</div>
    </div>
  );
}

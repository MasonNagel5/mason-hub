"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/client";
import { ymd } from "@/lib/dates.js";
import LineChart from "../components/LineChart";

const METRICS = [
  { key: "best1RM", label: "Est. 1RM", color: "var(--color-accent)" },
  { key: "topWeight", label: "Top set weight", color: "var(--color-green)" },
  { key: "volume", label: "Volume", color: "var(--color-orange)" },
];

export default function GymPage() {
  const [exercises, setExercises] = useState([]);
  const [ppl, setPpl] = useState(null);

  async function loadMeta() {
    try {
      const w = await api("/api/gym/workouts");
      setExercises(w.exercises);
    } catch {}
    try {
      const s = await api("/api/settings");
      setPpl(s.pplToday);
    } catch {}
  }
  useEffect(() => {
    loadMeta();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>🏋 Gym</h2>
        {ppl && (
          <span style={{ fontSize: 13, color: "var(--color-muted)" }}>
            Today:{" "}
            <span style={{ color: ppl === "Rest" ? "var(--color-muted)" : "var(--color-green)", fontWeight: 600 }}>{ppl}</span>
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <WorkoutLogger exercises={exercises} onSaved={loadMeta} />
        <BodyWeight />
      </div>

      <div style={{ marginTop: 16 }}>
        <Progress exercises={exercises} onChanged={loadMeta} />
      </div>
    </div>
  );
}

// ---------------- Workout logger ----------------
function WorkoutLogger({ exercises, onSaved }) {
  const [date, setDate] = useState(ymd());
  const [exercise, setExercise] = useState("");
  const [rows, setRows] = useState([{ weight: "", reps: "" }]);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  function setRow(i, field, v) {
    setRows((r) => r.map((x, j) => (j === i ? { ...x, [field]: v } : x)));
  }
  function addRow() {
    setRows((r) => [...r, { weight: "", reps: "" }]);
  }
  function removeRow(i) {
    setRows((r) => (r.length === 1 ? r : r.filter((_, j) => j !== i)));
  }

  async function save() {
    if (!exercise.trim()) {
      setMsg("Enter an exercise name.");
      return;
    }
    const sets = rows.filter((r) => r.weight !== "" || r.reps !== "");
    if (sets.length === 0) {
      setMsg("Add at least one set.");
      return;
    }
    setSaving(true);
    try {
      await api("/api/gym/workouts", { method: "POST", body: JSON.stringify({ date, exercise, sets, notes }) });
      setMsg(`Logged ${sets.length} set${sets.length > 1 ? "s" : ""} of ${exercise}.`);
      setRows([{ weight: "", reps: "" }]);
      setNotes("");
      onSaved();
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg("Failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Log a workout</h3>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <Label>Date</Label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div style={{ flex: 2 }}>
          <Label>Exercise</Label>
          <input
            className="input"
            list="exercise-list"
            placeholder="e.g. Bench Press"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
          />
          <datalist id="exercise-list">
            {exercises.map((e) => (
              <option key={e.exercise} value={e.exercise} />
            ))}
          </datalist>
        </div>
      </div>

      <Label>Sets</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 18, fontSize: 12, color: "var(--color-muted)" }}>{i + 1}</span>
            <input className="input" type="number" inputMode="decimal" placeholder="weight (lbs)" value={r.weight} onChange={(e) => setRow(i, "weight", e.target.value)} />
            <span style={{ color: "var(--color-muted)", fontSize: 13 }}>×</span>
            <input className="input" type="number" inputMode="numeric" placeholder="reps" value={r.reps} onChange={(e) => setRow(i, "reps", e.target.value)} />
            <button className="btn" style={{ padding: "4px 8px" }} onClick={() => removeRow(i)} title="Remove set">✕</button>
          </div>
        ))}
      </div>
      <button className="btn" style={{ marginTop: 8, fontSize: 12 }} onClick={addRow}>+ Add set</button>

      <div style={{ marginTop: 10 }}>
        <Label>Notes (optional)</Label>
        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="felt strong, tweak grip…" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
        <button className="btn btn-accent" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save workout"}</button>
        {msg && <span style={{ fontSize: 12, color: msg.startsWith("Failed") ? "var(--color-red)" : "var(--color-green)" }}>{msg}</span>}
      </div>
    </div>
  );
}

// ---------------- Progress ----------------
function Progress({ exercises, onChanged }) {
  const [exercise, setExercise] = useState("");
  const [metric, setMetric] = useState("best1RM");
  const [series, setSeries] = useState([]);
  const [sets, setSets] = useState([]);

  useEffect(() => {
    if (!exercise && exercises.length) setExercise(exercises[0].exercise);
  }, [exercises, exercise]);

  async function load() {
    if (!exercise) {
      setSeries([]);
      setSets([]);
      return;
    }
    try {
      const p = await api(`/api/gym/progress?exercise=${encodeURIComponent(exercise)}`);
      setSeries(p.series);
    } catch {}
    try {
      const w = await api(`/api/gym/workouts?exercise=${encodeURIComponent(exercise)}`);
      setSets(w.sets);
    } catch {}
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise]);

  async function del(id) {
    await api(`/api/gym/workouts?id=${id}`, { method: "DELETE" });
    load();
    onChanged();
  }

  const m = METRICS.find((x) => x.key === metric);
  const labels = series.map((s) => s.date);
  const chartSeries = [{ name: m.label, color: m.color, values: series.map((s) => Math.round(s[metric])) }];

  const best = series.length ? Math.max(...series.map((s) => s.best1RM)) : null;
  const heaviest = series.length ? Math.max(...series.map((s) => s.topWeight)) : null;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Progress</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select className="input" style={{ width: "auto" }} value={exercise} onChange={(e) => setExercise(e.target.value)}>
            {exercises.length === 0 && <option value="">— no exercises yet —</option>}
            {exercises.map((e) => (
              <option key={e.exercise} value={e.exercise}>{e.exercise}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 4 }}>
            {METRICS.map((x) => (
              <button key={x.key} className={metric === x.key ? "btn btn-accent" : "btn"} style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setMetric(x.key)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {best != null && (
        <div style={{ display: "flex", gap: 20, marginBottom: 10, fontSize: 13 }}>
          <Stat label="Best est. 1RM" value={`${best} lbs`} />
          <Stat label="Heaviest set" value={`${heaviest} lbs`} />
          <Stat label="Sessions" value={series.length} />
        </div>
      )}

      <LineChart labels={labels} series={chartSeries} unit={metric === "volume" ? "" : " lbs"} />

      {sets.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--color-muted)" }}>Recent sets ({sets.length})</summary>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <tr style={{ color: "var(--color-muted)", fontSize: 11, textTransform: "uppercase" }}>
                <th style={{ textAlign: "left", padding: "4px 0" }}>Date</th>
                <th style={{ textAlign: "left" }}>Set</th>
                <th style={{ textAlign: "right" }}>Weight</th>
                <th style={{ textAlign: "right" }}>Reps</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sets.slice(0, 40).map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "5px 0" }}>{s.date}</td>
                  <td style={{ color: "var(--color-muted)" }}>{s.set_num}</td>
                  <td style={{ textAlign: "right" }}>{s.weight ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>{s.reps ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => del(s.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

// ---------------- Bodyweight ----------------
function BodyWeight() {
  const [weights, setWeights] = useState([]);
  const [date, setDate] = useState(ymd());
  const [weight, setWeight] = useState("");
  const [msg, setMsg] = useState(null);

  async function load() {
    try {
      setWeights((await api("/api/gym/weight")).weights);
    } catch {}
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) {
      setMsg("Enter a valid weight.");
      return;
    }
    try {
      const r = await api("/api/gym/weight", { method: "POST", body: JSON.stringify({ date, weight: w }) });
      setWeights(r.weights);
      setWeight("");
      setMsg("Saved.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setMsg("Failed: " + e.message);
    }
  }
  async function del(id) {
    await api(`/api/gym/weight?id=${id}`, { method: "DELETE" });
    load();
  }

  const labels = weights.map((w) => w.date);
  const series = [{ name: "Bodyweight", color: "var(--color-accent)", values: weights.map((w) => w.weight) }];
  const latest = weights.length ? weights[weights.length - 1].weight : null;
  const change = weights.length > 1 ? +(latest - weights[0].weight).toFixed(1) : null;

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Bodyweight</h3>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <Label>Date</Label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Weight (lbs)</Label>
          <input className="input" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 178.5" onKeyDown={(e) => e.key === "Enter" && save()} />
        </div>
        <button className="btn btn-accent" onClick={save}>Log</button>
      </div>
      {msg && <div style={{ fontSize: 12, color: msg.startsWith("Failed") ? "var(--color-red)" : "var(--color-green)", marginTop: 6 }}>{msg}</div>}

      {latest != null && (
        <div style={{ display: "flex", gap: 20, margin: "12px 0", fontSize: 13 }}>
          <Stat label="Latest" value={`${latest} lbs`} />
          {change != null && (
            <Stat label="Net change" value={`${change > 0 ? "+" : ""}${change} lbs`} color={change > 0 ? "var(--color-orange)" : "var(--color-green)"} />
          )}
          <Stat label="Entries" value={weights.length} />
        </div>
      )}

      <LineChart labels={labels} series={series} unit=" lbs" height={220} />

      {weights.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--color-muted)" }}>All entries ({weights.length})</summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
            {[...weights].reverse().map((w) => (
              <div key={w.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", borderTop: "1px solid var(--color-border)" }}>
                <span style={{ color: "var(--color-muted)" }}>{w.date}</span>
                <span>{w.weight} lbs</span>
                <button className="btn" style={{ padding: "1px 6px", fontSize: 11 }} onClick={() => del(w.id)}>✕</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ---------------- small bits ----------------
function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{children}</div>;
}
function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || "var(--color-text)" }}>{value}</div>
    </div>
  );
}

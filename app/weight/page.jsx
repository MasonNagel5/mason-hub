"use client";

import { useEffect, useState } from "react";
import { store } from "../lib/client";
import LineChart from "../components/LineChart";
import { ymd } from "@/lib/dates.js";

export default function WeightPage() {
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(ymd());
  const [weight, setWeight] = useState("");
  const [msg, setMsg] = useState(null);

  async function load() {
    const list = await store.list("weight");
    list.sort((a, b) => a.date.localeCompare(b.date));
    setRows(list);
  }
  useEffect(() => { load().catch(() => {}); }, []);

  async function save() {
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) { setMsg("Enter a valid weight."); return; }
    const existing = rows.find((r) => r.date === date);
    if (existing) await store.update("weight", existing.id, { weight: w });
    else await store.add("weight", { date, weight: w });
    setWeight(""); setMsg("Saved.");
    load();
    setTimeout(() => setMsg(null), 1500);
  }
  async function del(id) { await store.remove("weight", id); load(); }

  const labels = rows.map((r) => r.date);
  const series = [{ name: "Bodyweight", color: "var(--color-accent)", values: rows.map((r) => r.weight) }];
  const latest = rows.length ? rows[rows.length - 1].weight : null;
  const change = rows.length > 1 ? +(latest - rows[0].weight).toFixed(1) : null;

  return (
    <div style={{ maxWidth: 760 }}>
      <h2 className="page-title">⚖ Weight</h2>
      <p className="page-sub">Log your bodyweight and watch the trend. Saved to your vault.</p>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 3 }}>Date</div>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 3 }}>Weight (lbs)</div>
            <input className="input" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 178.5" onKeyDown={(e) => e.key === "Enter" && save()} />
          </div>
          <button className="btn btn-accent" onClick={save}>Log</button>
        </div>
        {msg && <div style={{ fontSize: 12, color: "var(--color-green)", marginTop: 6 }}>{msg}</div>}
        {latest != null && (
          <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
            <Stat label="Latest" value={`${latest} lbs`} />
            {change != null && <Stat label="Net change" value={`${change > 0 ? "+" : ""}${change} lbs`} color={change > 0 ? "var(--color-orange)" : "var(--color-green)"} />}
            <Stat label="Entries" value={rows.length} />
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <LineChart labels={labels} series={series} unit=" lbs" height={240} />
      </div>

      {rows.length > 0 && (
        <details>
          <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--color-muted)" }}>All entries ({rows.length})</summary>
          <div style={{ marginTop: 8 }}>
            {[...rows].reverse().map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderTop: "1px solid var(--color-border)" }}>
                <span style={{ color: "var(--color-muted)" }}>{r.date}</span>
                <span>{r.weight} lbs</span>
                <button className="btn" style={{ padding: "1px 6px", fontSize: 11 }} onClick={() => del(r.id)}>✕</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || "var(--color-text)" }}>{value}</div>
    </div>
  );
}

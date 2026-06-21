"use client";

import { useEffect, useMemo, useState } from "react";
import { store } from "../lib/client";
import { ymd } from "@/lib/dates.js";

const EXPENSE_CATS = ["Food", "Rent", "Transport", "Subscriptions", "School", "Fun", "Other"];
const INCOME_CATS = ["RA stipend", "SFS stipend", "Internship", "Scholarship", "Other"];

export default function BudgetPage() {
  const [rows, setRows] = useState([]);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(ymd());

  async function load() { try { setRows(await store.list("budget")); } catch {} }
  useEffect(() => { load(); }, []);

  async function add() {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    await store.add("budget", { date, type, category, amount: amt, note: note.trim() });
    setAmount(""); setNote(""); load();
  }
  async function del(id) { const { items } = await store.remove("budget", id); setRows(items); }

  const month = ymd().slice(0, 7);
  const summary = useMemo(() => {
    let income = 0, expense = 0;
    const byCat = {};
    for (const r of rows) {
      if (!r.date?.startsWith(month)) continue;
      if (r.type === "income") income += r.amount;
      else { expense += r.amount; byCat[r.category] = (byCat[r.category] || 0) + r.amount; }
    }
    return { income, expense, net: income - expense, byCat };
  }, [rows, month]);

  const recent = [...rows].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 40);

  return (
    <div style={{ maxWidth: 880 }}>
      <h2 className="page-title">💵 Budget</h2>
      <p className="page-sub">Track income and spending. This month's summary updates live. Saved to your vault.</p>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <SummaryCard label="Income (this month)" value={summary.income} color="var(--color-green)" />
        <SummaryCard label="Spending (this month)" value={summary.expense} color="var(--color-orange)" />
        <SummaryCard label="Net" value={summary.net} color={summary.net >= 0 ? "var(--color-green)" : "var(--color-red)"} />
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button className={type === "expense" ? "btn btn-accent" : "btn"} onClick={() => { setType("expense"); setCategory(EXPENSE_CATS[0]); }}>Expense</button>
            <button className={type === "income" ? "btn btn-accent" : "btn"} onClick={() => { setType("income"); setCategory(INCOME_CATS[0]); }}>Income</button>
          </div>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 150 }} />
          <select className="input" style={{ width: 150 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            {(type === "expense" ? EXPENSE_CATS : INCOME_CATS).map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="input" type="number" placeholder="$ amount" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 120 }} onKeyDown={(e) => e.key === "Enter" && add()} />
          <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1, minWidth: 120 }} />
          <button className="btn btn-accent" onClick={add}>Add</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>Spending by category (this month)</h3>
          {Object.keys(summary.byCat).length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-muted)" }}>No spending logged this month.</div>
          ) : (
            Object.entries(summary.byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => {
              const pct = summary.expense ? Math.round((v / summary.expense) * 100) : 0;
              return (
                <div key={c} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}><span>{c}</span><span style={{ color: "var(--color-muted)" }}>${v.toFixed(0)} · {pct}%</span></div>
                  <div style={{ height: 6, background: "var(--color-bg)", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: "var(--color-orange)" }} /></div>
                </div>
              );
            })
          )}
        </div>

        <div className="card" style={{ padding: 12 }}>
          <h3 style={{ margin: "4px 8px 10px", fontSize: 14 }}>Recent</h3>
          <table className="sheet">
            <thead><tr><th>Date</th><th>Category</th><th style={{ textAlign: "right" }}>Amount</th><th>Note</th><th></th></tr></thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: "var(--color-muted)" }}>{r.date}</td>
                  <td>{r.category}</td>
                  <td style={{ textAlign: "right", color: r.type === "income" ? "var(--color-green)" : "var(--color-text)" }}>{r.type === "income" ? "+" : "−"}${r.amount.toFixed(2)}</td>
                  <td style={{ color: "var(--color-muted)" }}>{r.note}</td>
                  <td><button className="btn" style={{ padding: "1px 6px", fontSize: 11 }} onClick={() => del(r.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && <div style={{ fontSize: 13, color: "var(--color-muted)", padding: 8 }}>Nothing logged yet.</div>}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="card" style={{ padding: 16, flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>${Math.abs(value).toFixed(2)}</div>
    </div>
  );
}

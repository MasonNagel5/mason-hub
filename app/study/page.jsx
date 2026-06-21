"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/client";
import LineChart from "../components/LineChart";

export default function StudyPage() {
  const [tab, setTab] = useState("focus");
  return (
    <div>
      <h2 className="page-title">📚 Study</h2>
      <p className="page-sub">Categorized focus timer, study-hour trends, and native Security+ flashcards. Everything logs to your vault.</p>
      <div style={{ marginBottom: 18 }}>
        <button className={`subtab ${tab === "focus" ? "active" : ""}`} onClick={() => setTab("focus")}>Focus & Hours</button>
        <button className={`subtab ${tab === "cards" ? "active" : ""}`} onClick={() => setTab("cards")}>Security+ Flashcards</button>
      </div>
      {tab === "focus" ? <Focus /> : <Flashcards />}
    </div>
  );
}

// ---------------- Focus timer + hours graph ----------------
function Focus() {
  const [data, setData] = useState({ todayMinutes: 0, recent: [], series: [], categoryTotals: {}, categories: [] });
  const [category, setCategory] = useState("Certs");
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const startRef = useRef(null);
  const tickRef = useRef(null);

  async function load() { try { setData(await api("/api/study")); } catch {} }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => setRemaining((r) => { if (r <= 1) { finish(true); return 0; } return r - 1; }), 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function start() { setRemaining(minutes * 60); setRunning(true); startRef.current = Date.now(); }
  async function finish(completed) {
    clearInterval(tickRef.current);
    setRunning(false);
    const elapsed = startRef.current ? (Date.now() - startRef.current) / 60000 : 0;
    const logged = completed ? minutes : elapsed;
    if (logged >= 1) {
      try { await api("/api/study", { method: "POST", body: JSON.stringify({ category, subject, minutes: logged }) }); } catch {}
      load();
    }
    setRemaining(minutes * 60);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const labels = data.series.map((d) => d.date);
  const hours = [{ name: "Hours", color: "var(--color-accent)", values: data.series.map((d) => +(d.total / 60).toFixed(2)) }];
  const weekMin = data.series.slice(-7).reduce((s, d) => s + d.total, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Focus timer</h3>
        {!running ? (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Category</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {data.categories.map((c) => (
                <button key={c} className={category === c ? "btn btn-accent" : "btn"} style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
            <input className="input" placeholder="Optional detail (e.g. Domain 2, PA 1)" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {[25, 50, 15].map((m) => (
                <button key={m} className={minutes === m ? "btn btn-accent" : "btn"} style={{ flex: 1, fontSize: 12 }} onClick={() => setMinutes(m)}>{m}m</button>
              ))}
            </div>
            <button className="btn btn-accent" style={{ width: "100%" }} onClick={start}>Start</button>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase" }}>{category}{subject ? ` · ${subject}` : ""}</div>
            <div style={{ fontSize: 52, fontWeight: 800, fontVariantNumeric: "tabular-nums", margin: "8px 0" }}>{mm}:{ss}</div>
            <button className="btn" style={{ width: "100%" }} onClick={() => finish(false)}>Stop & log</button>
          </div>
        )}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)", fontSize: 13 }}>
          <Stat label="Today" value={`${data.todayMinutes} min`} />
          <div style={{ height: 8 }} />
          <Stat label="Last 7 days" value={`${(weekMin / 60).toFixed(1)} hrs`} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Study hours - last 30 days</h3>
          <LineChart labels={labels} series={hours} unit=" hrs" yZero height={220} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>By category (all time)</h3>
          {Object.keys(data.categoryTotals).length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-muted)" }}>No sessions logged yet.</div>
          ) : (
            Object.entries(data.categoryTotals).sort((a, b) => b[1] - a[1]).map(([c, m]) => (
              <div key={c} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                <span>{c}</span><span style={{ color: "var(--color-muted)" }}>{(m / 60).toFixed(1)} hrs</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Security+ flashcards ----------------
const GRADES = [
  { key: "again", label: "Again", color: "var(--color-red)" },
  { key: "hard", label: "Hard", color: "var(--color-orange)" },
  { key: "good", label: "Good", color: "var(--color-accent)" },
  { key: "easy", label: "Easy", color: "var(--color-green)" },
];

function Flashcards() {
  const [stats, setStats] = useState(null);
  const [domain, setDomain] = useState("");
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState(0);
  const startRef = useRef(null);

  async function loadStats() { try { setStats(await api("/api/secplus/stats")); } catch {} }
  useEffect(() => { loadStats(); }, []);

  async function startSession() {
    const { cards } = await api(`/api/secplus/queue?limit=20${domain ? `&domain=${domain}` : ""}`);
    if (!cards.length) return;
    setQueue(cards); setIdx(0); setFlipped(false); setDone(0); setReviewing(true); startRef.current = Date.now();
  }
  async function grade(g) {
    const card = queue[idx];
    try { await api("/api/secplus/review", { method: "POST", body: JSON.stringify({ cardId: card.id, grade: g }) }); } catch {}
    const nd = done + 1; setDone(nd);
    if (idx + 1 < queue.length) { setIdx(idx + 1); setFlipped(false); } else endSession(nd);
  }
  async function endSession(count = done) {
    setReviewing(false);
    const mins = startRef.current ? (Date.now() - startRef.current) / 60000 : 0;
    if (count > 0) {
      const dName = domain ? stats?.domains.find((d) => d.id === domain)?.name : "all domains";
      try { await api("/api/study", { method: "POST", body: JSON.stringify({ category: "Certs", subject: `Security+ ${dName}`, minutes: mins, kind: "flashcards", detail: `${count} cards` }) }); } catch {}
    }
    loadStats();
  }

  useEffect(() => {
    if (!reviewing) return;
    function onKey(e) {
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); }
      else if (flipped && ["1", "2", "3", "4"].includes(e.key)) grade(GRADES[Number(e.key) - 1].key);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewing, flipped, idx, queue]);

  if (!stats) return <div style={{ color: "var(--color-muted)" }}>Loading…</div>;
  const card = queue[idx];

  if (reviewing) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 13, color: "var(--color-muted)" }}>
          <span>Card {idx + 1} of {queue.length}</span>
          <button className="btn" style={{ padding: "3px 10px" }} onClick={() => endSession()}>End session</button>
        </div>
        <div className="card" onClick={() => setFlipped((f) => !f)} style={{ padding: "44px 28px", minHeight: 230, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 14 }}>
            Domain {card.domain}{card.progress?.lapses ? ` · missed ${card.progress.lapses}×` : card.progress ? " · review" : " · new"}
          </div>
          <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.4 }}>{card.front}</div>
          {flipped && <><div style={{ width: "60%", height: 1, background: "var(--color-border)", margin: "20px 0" }} /><div style={{ fontSize: 16, lineHeight: 1.5 }}>{card.back}</div></>}
          {!flipped && <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 18 }}>Click or press Space to flip</div>}
        </div>
        {flipped && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {GRADES.map((g, i) => <button key={g.key} className="btn" onClick={() => grade(g.key)} style={{ flex: 1, maxWidth: 140, borderColor: g.color, color: g.color, padding: 10 }}>{g.label} <span style={{ opacity: 0.5, fontSize: 11 }}>{i + 1}</span></button>)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <span style={{ color: "var(--color-muted)", fontSize: 13 }}>Exam in </span>
            <b style={{ color: stats.daysToExam <= 14 ? "var(--color-red)" : "var(--color-accent)", fontSize: 16 }}>{stats.daysToExam} days</b>
            <span style={{ color: "var(--color-muted)", fontSize: 13 }}> · today's focus: {stats.todaysDomain?.name}</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select className="input" style={{ width: "auto" }} value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="">All domains</option>
              {stats.domains.map((d) => <option key={d.id} value={d.id}>D{d.id} - {d.name}</option>)}
            </select>
            <button className="btn btn-accent" onClick={startSession}>Start review →</button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{stats.totalDue} cards due{stats.weakest ? ` · weakest: ${stats.weakest.name}` : ""}</div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Domain mastery</h3>
        {stats.domains.map((d) => {
          const pct = d.total ? Math.round((d.mature / d.total) * 100) : 0;
          return (
            <div key={d.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span>D{d.id} · {d.name} <span style={{ color: "var(--color-muted)" }}>({d.weight}%)</span></span>
                <span style={{ color: "var(--color-muted)" }}>{d.mature}/{d.total} mastered · {d.due} due</span>
              </div>
              <div style={{ height: 6, background: "var(--color-bg)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-green)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}

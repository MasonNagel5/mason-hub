"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/client";

const GRADES = [
  { key: "again", label: "Again", color: "var(--color-red)" },
  { key: "hard", label: "Hard", color: "var(--color-orange)" },
  { key: "good", label: "Good", color: "var(--color-accent)" },
  { key: "easy", label: "Easy", color: "var(--color-green)" },
];

export default function SecPlusPage() {
  const [stats, setStats] = useState(null);
  const [domain, setDomain] = useState("");
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState(0);
  const startRef = useRef(null);

  async function loadStats() {
    try {
      setStats(await api("/api/secplus/stats"));
    } catch {}
  }
  useEffect(() => {
    loadStats();
  }, []);

  async function startSession() {
    const { cards } = await api(`/api/secplus/queue?limit=20${domain ? `&domain=${domain}` : ""}`);
    if (!cards.length) return;
    setQueue(cards);
    setIdx(0);
    setFlipped(false);
    setDone(0);
    setReviewing(true);
    startRef.current = Date.now();
  }

  async function grade(g) {
    const card = queue[idx];
    try {
      await api("/api/secplus/review", { method: "POST", body: JSON.stringify({ cardId: card.id, grade: g }) });
    } catch {}
    const nextDone = done + 1;
    setDone(nextDone);
    if (idx + 1 < queue.length) {
      setIdx(idx + 1);
      setFlipped(false);
    } else {
      endSession(nextDone);
    }
  }

  async function endSession(count = done) {
    setReviewing(false);
    const minutes = startRef.current ? (Date.now() - startRef.current) / 60000 : 0;
    if (count > 0) {
      const dName = domain ? stats?.domains.find((d) => d.id === domain)?.name : "all domains";
      try {
        await api("/api/study", {
          method: "POST",
          body: JSON.stringify({ kind: "flashcards", subject: `Security+ — ${dName}`, minutes, detail: `${count} cards` }),
        });
      } catch {}
    }
    loadStats();
  }

  // Keyboard: space to flip, 1-4 to grade.
  useEffect(() => {
    if (!reviewing) return;
    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        grade(GRADES[Number(e.key) - 1].key);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewing, flipped, idx, queue]);

  if (!stats) return <div style={{ color: "var(--color-muted)" }}>Loading…</div>;

  const card = queue[idx];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>🎯 Security+ <span style={{ color: "var(--color-muted)", fontSize: 14, fontWeight: 400 }}>SY0-701</span></h2>
        <div style={{ fontSize: 13 }}>
          <span style={{ color: "var(--color-muted)" }}>Exam in </span>
          <span style={{ fontWeight: 700, color: stats.daysToExam <= 14 ? "var(--color-red)" : "var(--color-accent)" }}>{stats.daysToExam} days</span>
          <span style={{ color: "var(--color-muted)" }}> · {stats.examDate}</span>
        </div>
      </div>

      {!reviewing ? (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 4 }}>Today's focus domain</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>{stats.todaysDomain.name}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select className="input" style={{ width: "auto" }} value={domain} onChange={(e) => setDomain(e.target.value)}>
                <option value="">All domains</option>
                {stats.domains.map((d) => (
                  <option key={d.id} value={d.id}>Domain {d.id} — {d.name}</option>
                ))}
              </select>
              <button className="btn btn-accent" onClick={startSession}>Start review →</button>
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{stats.totalDue} cards due across all domains</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Domain progress</h3>
              {stats.weakest && (
                <span style={{ fontSize: 12, color: "var(--color-orange)" }}>Weakest: {stats.weakest.name}</span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.domains.map((d) => {
                const pct = d.total ? Math.round((d.mature / d.total) * 100) : 0;
                return (
                  <div key={d.id}>
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
        </>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 13, color: "var(--color-muted)" }}>
            <span>Card {idx + 1} of {queue.length}</span>
            <button className="btn" style={{ padding: "3px 10px" }} onClick={() => endSession()}>End session</button>
          </div>
          <div
            className="card"
            onClick={() => setFlipped((f) => !f)}
            style={{ padding: "40px 28px", minHeight: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer", marginBottom: 16 }}
          >
            <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 14 }}>
              Domain {card.domain}{card.progress?.lapses ? ` · missed ${card.progress.lapses}×` : card.progress ? " · review" : " · new"}
            </div>
            <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.4 }}>{card.front}</div>
            {flipped && (
              <>
                <div style={{ width: "60%", height: 1, background: "var(--color-border)", margin: "20px 0" }} />
                <div style={{ fontSize: 16, color: "var(--color-text)", lineHeight: 1.5 }}>{card.back}</div>
              </>
            )}
            {!flipped && <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 18 }}>Click or press Space to flip</div>}
          </div>

          {flipped && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {GRADES.map((g, i) => (
                <button key={g.key} className="btn" onClick={() => grade(g.key)} style={{ flex: 1, maxWidth: 140, borderColor: g.color, color: g.color, padding: "10px" }}>
                  {g.label} <span style={{ opacity: 0.5, fontSize: 11 }}>{i + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

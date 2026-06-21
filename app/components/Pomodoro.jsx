"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/client";

const PRESETS = [25, 50, 15];

// Common things Mason works on — quick-pick subjects for zero-friction logging.
const SUBJECTS = [
  "Security+ — Domain study",
  "CptS 360 — Systems Programming",
  "CptS 327 — Crypto",
  "ICS Anomaly Detection",
  "SWE Internship",
  "Technical Writing",
  "Other",
];

export default function Pomodoro({ collapsed }) {
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [custom, setCustom] = useState("");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [todayMin, setTodayMin] = useState(0);
  const startRef = useRef(null);
  const tickRef = useRef(null);

  async function loadToday() {
    try {
      setTodayMin((await api("/api/study")).todayMinutes);
    } catch {}
  }
  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          finish(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function startTimer() {
    setRemaining(minutes * 60);
    setRunning(true);
    startRef.current = Date.now();
  }

  async function finish(completed) {
    clearInterval(tickRef.current);
    setRunning(false);
    const elapsedMin = startRef.current ? (Date.now() - startRef.current) / 60000 : 0;
    const logged = completed ? minutes : elapsedMin;
    if (logged >= 1) {
      const subj = subject === "Other" ? custom || "Focus session" : subject;
      try {
        await api("/api/study", { method: "POST", body: JSON.stringify({ kind: "focus", subject: subj, minutes: logged }) });
        loadToday();
      } catch {}
    }
    setRemaining(minutes * 60);
    if (completed && typeof window !== "undefined") {
      try {
        new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play();
      } catch {}
    }
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  if (collapsed) {
    return (
      <button className="btn" onClick={() => setOpen(true)} title="Pomodoro" style={{ width: "100%", marginBottom: 8 }}>
        {running ? `⏱ ${mm}:${ss}` : "⏱"}
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setOpen((o) => !o)}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>⏱ Focus {running && <span style={{ color: "var(--color-accent)" }}>{mm}:{ss}</span>}</span>
        <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{todayMin}m today</span>
      </div>

      {(open || running) && (
        <div style={{ marginTop: 8 }}>
          {!running ? (
            <>
              <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ marginBottom: 6, fontSize: 12 }}>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {subject === "Other" && (
                <input className="input" placeholder="What are you working on?" value={custom} onChange={(e) => setCustom(e.target.value)} style={{ marginBottom: 6, fontSize: 12 }} />
              )}
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {PRESETS.map((m) => (
                  <button key={m} className={minutes === m ? "btn btn-accent" : "btn"} style={{ flex: 1, padding: "3px", fontSize: 12 }} onClick={() => setMinutes(m)}>{m}m</button>
                ))}
              </div>
              <button className="btn btn-accent" style={{ width: "100%", fontSize: 12 }} onClick={startTimer}>Start</button>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", margin: "4px 0" }}>{mm}:{ss}</div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", textAlign: "center", marginBottom: 6 }}>{subject === "Other" ? custom : subject}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn" style={{ flex: 1, fontSize: 12 }} onClick={() => finish(false)}>Stop & log</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

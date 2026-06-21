"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/client";
import { fmtTime } from "@/lib/dates.js";

export default function Briefing() {
  const [b, setB] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    api("/api/briefing").then(setB).catch(() => {});
  }, []);

  if (!b) return null;

  const lines = [];
  if (b.securityPlus) {
    const sp = b.securityPlus;
    lines.push({
      icon: "🎯",
      text: (
        <>
          <b>{sp.daysToExam} days</b> to Security+ · today cover <b>{sp.todaysDomain?.name}</b>
          {sp.cardsDue ? <> · <b>{sp.cardsDue}</b> cards due</> : null}
          {sp.weakest ? <span style={{ color: "var(--color-orange)" }}> · weakest: {sp.weakest.name}</span> : null}
        </>
      ),
    });
  }
  if (b.examsSoon?.length) {
    const e = b.examsSoon[0];
    lines.push({ icon: "📝", text: <><b>{e.name}</b> ({e.className}) in <b style={{ color: e.daysUntil <= 7 ? "var(--color-red)" : "inherit" }}>{e.daysUntil}d</b></> });
  }
  lines.push({
    icon: "📋",
    text: b.dueSoon?.length
      ? <><b>{b.dueSoon.length}</b> due in 72h: {b.dueSoon.slice(0, 3).map((d) => d.name).join(", ")}{b.dueSoon.length > 3 ? "…" : ""}</>
      : <span style={{ color: "var(--color-muted)" }}>Nothing due in the next 72 hours</span>,
  });
  if (b.dailyContact) {
    lines.push({
      icon: "🤝",
      text: <>Reach out to <b>{b.dailyContact.name}</b>{b.dailyContact.org ? ` (${b.dailyContact.org})` : ""}{b.overdueContactCount ? <span style={{ color: "var(--color-yellow)" }}> · {b.overdueContactCount} overdue</span> : null}</>,
    });
  }
  lines.push({
    icon: "🏠",
    text: b.ra?.onCallNow
      ? <b style={{ color: "var(--color-orange)" }}>RA: on call now</b>
      : b.ra?.todayShift
      ? <>RA shift today{b.ra.todayShift.start_time ? ` ${b.ra.todayShift.start_time}–${b.ra.todayShift.end_time}` : b.ra.todayShift.start ? ` ${fmtTime(b.ra.todayShift.start)}` : ""}</>
      : <span style={{ color: "var(--color-muted)" }}>No RA shift today</span>,
  });

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16, background: "linear-gradient(180deg, var(--color-card-2), var(--color-card))" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 12 : 0 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>☀️ Morning briefing</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {b.studyMinutesToday > 0 && <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{b.studyMinutesToday}m focused today</span>}
          <button className="btn" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => setOpen((o) => !o)}>{open ? "Hide" : "Show"}</button>
        </div>
      </div>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
          {lines.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "baseline" }}>
              <span>{l.icon}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

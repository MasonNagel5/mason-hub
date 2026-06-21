"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/client";
import { fmtTime, ymd } from "@/lib/dates.js";

const SRC_COLOR = {
  assignment: "var(--color-accent)",
  exam: "var(--color-red)",
  shift: "var(--color-orange)",
  manual: "var(--color-green)",
  task: "var(--color-muted)",
};

export default function WeekView() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/week")
      .then((d) => setDays(d.days))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 8, fontSize: 13, color: "var(--color-muted)" }}>Loading week…</div>;

  const today = ymd();
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {days.map((d) => (
          <div key={d.date} style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: "1px solid var(--color-border)" }}>
            <div style={{ width: 110, flexShrink: 0, fontSize: 12, fontWeight: 600, color: d.date === today ? "var(--color-accent)" : "var(--color-text)" }}>
              {d.date === today ? "Today" : d.label}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              {d.items.length === 0 ? (
                <span style={{ fontSize: 12, color: "var(--color-muted)" }}>—</span>
              ) : (
                d.items.map((it) => {
                  const color = it.type === "exam" ? SRC_COLOR.exam : SRC_COLOR[it.source] || "var(--color-muted)";
                  return (
                    <div key={it.id} style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "baseline" }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: color, flexShrink: 0, marginTop: 5 }} />
                      <span style={{ flex: 1 }}>
                        {it.title}
                        {it.className ? <span style={{ color: "var(--color-muted)" }}> · {it.className}</span> : ""}
                        {it.type === "exam" ? <span className="tag" style={{ marginLeft: 6, color: SRC_COLOR.exam, borderColor: SRC_COLOR.exam }}>exam</span> : ""}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{fmtTime(it.start)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

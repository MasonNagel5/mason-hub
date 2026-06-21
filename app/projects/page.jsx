"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/client";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/projects").then((r) => setProjects(r.projects)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="page-title">🧩 Projects</h2>
      <p className="page-sub">Live view of your active projects from the vault (10 - Projects). Status and next action are read straight from each note.</p>

      {loading ? (
        <div style={{ color: "var(--color-muted)", fontSize: 13 }}>Loading…</div>
      ) : projects.length === 0 ? (
        <div style={{ color: "var(--color-muted)", fontSize: 13 }}>No projects found in the vault.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {projects.map((p) => (
            <div key={p.folder} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>{p.title}</h3>
                {p.status && <span className="tag" style={{ whiteSpace: "nowrap" }}>{p.status}</span>}
              </div>
              {p.target && <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4 }}>🎯 {p.target}</div>}
              {p.nextAction ? (
                <div style={{ fontSize: 13, marginTop: 10 }}>
                  <span style={{ color: "var(--color-muted)" }}>Next: </span>{p.nextAction}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 10 }}>No open next action.</div>
              )}
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 12, wordBreak: "break-all" }}>{p.relPath}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

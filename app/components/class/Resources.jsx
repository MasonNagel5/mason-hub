"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/client";

const KINDS = ["textbook", "link", "tool", "reference"];
const KIND_ICON = { textbook: "📘", link: "🔗", tool: "🛠", reference: "📑" };

export default function Resources({ slug }) {
  const [resources, setResources] = useState([]);
  const [canSeed, setCanSeed] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("link");
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      const r = await api(`/api/classes/${slug}/resources`);
      setResources(r.resources);
      setCanSeed(r.canSeed);
    } catch {}
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function add() {
    if (!label.trim()) return;
    const r = await api(`/api/classes/${slug}/resources`, { method: "POST", body: JSON.stringify({ label, url, kind }) });
    setResources(r.resources);
    setLabel("");
    setUrl("");
    setAdding(false);
  }
  async function seed() {
    const r = await api(`/api/classes/${slug}/resources`, { method: "POST", body: JSON.stringify({ seed: true }) });
    setResources(r.resources);
  }
  async function remove(id) {
    const r = await api(`/api/classes/${slug}/resources?id=${id}`, { method: "DELETE" });
    setResources(r.resources);
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>📚 Resources</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {canSeed && resources.length === 0 && (
            <button className="btn" style={{ padding: "4px 10px" }} onClick={seed}>Load suggested</button>
          )}
          <button className="btn btn-accent" style={{ padding: "4px 10px" }} onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ Add"}</button>
        </div>
      </div>

      {adding && (
        <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, padding: 12, marginBottom: 14 }}>
          <input className="input" placeholder="Label (e.g. Course syllabus)" value={label} onChange={(e) => setLabel(e.target.value)} style={{ marginBottom: 8 }} autoFocus />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" placeholder="https:// (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
            <select className="input" style={{ width: 130 }} value={kind} onChange={(e) => setKind(e.target.value)}>
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <button className="btn btn-accent" onClick={add}>Save</button>
          </div>
        </div>
      )}

      {resources.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>No resources yet. Where do you go to study for this class? Add the links, textbooks, and tools here.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {resources.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--color-border)" }}>
              <span>{KIND_ICON[r.kind] || "🔗"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>{r.label}</a>
                ) : (
                  <span>{r.label}</span>
                )}
                {r.notes && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{r.notes}</div>}
              </div>
              <span className="tag" style={{ color: "var(--color-muted)" }}>{r.kind}</span>
              <button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => remove(r.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

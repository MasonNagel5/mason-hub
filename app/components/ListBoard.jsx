"use client";

import { useEffect, useState } from "react";
import { store } from "../lib/client";

/**
 * Lightweight idea/checklist board backed by a vault collection.
 * Each item: { id, text, category, done }. `categories` optionally splits into
 * columns; `checkable` shows checkboxes.
 */
export default function ListBoard({ collection, categories = [null], checkable = false, placeholder = "Add an idea…", seed }) {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loaded, setLoaded] = useState(false);

  async function load() {
    let list = await store.list(collection);
    if (list.length === 0 && seed && seed.length) {
      for (const s of seed) await store.add(collection, s);
      list = await store.list(collection);
    }
    setItems(list);
    setLoaded(true);
  }
  useEffect(() => { load().catch(() => setLoaded(true)); /* eslint-disable-next-line */ }, [collection]);

  async function add(category) {
    const text = (drafts[category || "_"] || "").trim();
    if (!text) return;
    const { items } = await store.add(collection, { text, category: category || null, done: false });
    setItems(items);
    setDrafts((d) => ({ ...d, [category || "_"]: "" }));
  }
  async function toggle(it) { const { items } = await store.update(collection, it.id, { done: !it.done }); setItems(items || []); if (!items) load(); }
  async function remove(id) { const { items } = await store.remove(collection, id); setItems(items); }

  if (!loaded) return <div style={{ color: "var(--color-muted)", fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${categories.length}, 1fr)`, gap: 16 }}>
      {categories.map((cat) => (
        <div key={cat || "all"} className="card" style={{ padding: 14 }}>
          {cat && <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>{cat}</h3>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {items.filter((i) => (cat ? i.category === cat : true)).map((it) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                {checkable && <input type="checkbox" checked={!!it.done} onChange={() => toggle(it)} style={{ accentColor: "var(--color-green)", cursor: "pointer" }} />}
                <span style={{ flex: 1, color: it.done ? "var(--color-muted)" : "var(--color-text)", textDecoration: it.done ? "line-through" : "none" }}>{it.text}</span>
                <button className="btn" style={{ padding: "1px 6px", fontSize: 11 }} onClick={() => remove(it.id)}>✕</button>
              </div>
            ))}
            {items.filter((i) => (cat ? i.category === cat : true)).length === 0 && (
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>Nothing yet.</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="input" placeholder={placeholder} value={drafts[cat || "_"] || ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [cat || "_"]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && add(cat)} />
            <button className="btn btn-accent" onClick={() => add(cat)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
}

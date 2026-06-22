"use client";

import { useEffect, useMemo, useState } from "react";
import { store } from "../lib/client";

/**
 * Generic editable, sortable "spreadsheet" backed by a vault JSON collection.
 * columns: [{ key, label, type: text|number|date|url|select, options?, width? }]
 */
export default function Tracker({ collection, columns, defaultSort, statusColors = {}, emptyHint, quickSorts = [] }) {
  const [rows, setRows] = useState([]);
  const [sortKey, setSortKey] = useState(defaultSort?.key || columns[0].key);
  const [sortDir, setSortDir] = useState(defaultSort?.dir || "asc");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    try { setRows(await store.list(collection)); } catch {}
    setLoaded(true);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [collection]);

  async function addRow() {
    const blank = {};
    for (const c of columns) blank[c.key] = c.type === "number" ? null : "";
    const { items } = await store.add(collection, blank);
    setRows(items);
  }
  function patchLocal(id, key, value) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
  }
  async function commit(id, key, value) {
    await store.update(collection, id, { [key]: value });
  }
  async function remove(id) {
    const { items } = await store.remove(collection, id);
    setRows(items);
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      // Blanks always sort last, regardless of direction (e.g. no deadline set).
      if (av === "" && bv !== "") return 1;
      if (bv === "" && av !== "") return -1;
      const na = Number(av), nb = Number(bv);
      let cmp;
      if (!isNaN(na) && !isNaN(nb) && av !== "" && bv !== "") cmp = na - nb;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  return (
    <div className="card" style={{ padding: 12, overflowX: "auto" }}>
      {quickSorts.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {quickSorts.map((q) => {
            const dir = q.dir || "asc";
            const active = sortKey === q.key && sortDir === dir;
            return (
              <button key={q.label} className={`btn ${active ? "btn-accent" : ""}`} style={{ fontSize: 12, padding: "3px 10px" }}
                onClick={() => { setSortKey(q.key); setSortDir(dir); }}>{q.label}</button>
            );
          })}
        </div>
      )}
      <table className="sheet">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => toggleSort(c.key)}>
                {c.label}{sortKey === c.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
            <th style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key} style={{ width: c.width }}>
                  <Cell c={c} value={row[c.key]} statusColors={statusColors}
                    onChange={(v) => patchLocal(row.id, c.key, v)}
                    onCommit={(v) => commit(row.id, c.key, v)} />
                </td>
              ))}
              <td><button className="btn" style={{ padding: "1px 6px", fontSize: 11 }} onClick={() => remove(row.id)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {loaded && rows.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--color-muted)", padding: "12px 8px" }}>{emptyHint || "No rows yet."}</div>
      )}
      <button className="btn" style={{ marginTop: 10 }} onClick={addRow}>+ Add row</button>
    </div>
  );
}

function Cell({ c, value, onChange, onCommit, statusColors }) {
  const base = { background: "transparent", border: "1px solid transparent", color: "var(--color-text)", width: "100%", fontSize: 13, padding: "3px 5px", borderRadius: 4 };
  const focus = (e) => (e.target.style.borderColor = "var(--color-border)");
  const blur = (e) => { e.target.style.borderColor = "transparent"; onCommit(e.target.value); };

  if (c.type === "select") {
    const color = statusColors[value];
    const optStyle = { background: "var(--color-card)", color: "var(--color-text)" };
    return (
      <select value={value || ""} onChange={(e) => { onChange(e.target.value); onCommit(e.target.value); }}
        style={{ ...base, border: `1px solid ${color || "var(--color-border)"}`, color: color || "var(--color-text)" }}>
        <option value="" style={optStyle}></option>
        {c.options.map((o) => <option key={o} value={o} style={optStyle}>{o}</option>)}
      </select>
    );
  }
  if (c.type === "url") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input defaultValue={value || ""} placeholder="https://" onFocus={focus} onBlur={blur} style={base} />
        {value ? <a href={value} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>↗</a> : null}
      </div>
    );
  }
  return (
    <input type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"} defaultValue={value ?? ""}
      onFocus={focus} onChange={(e) => onChange(e.target.value)} onBlur={blur} style={base} />
  );
}

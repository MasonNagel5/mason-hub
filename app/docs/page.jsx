"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/client";

export default function DocsPage() {
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  async function load() { try { setFiles((await api("/api/docs")).files); } catch {} }
  useEffect(() => { load(); }, []);

  async function upload(list) {
    if (!list || !list.length) return;
    setUploading(true);
    const fd = new FormData();
    for (const f of list) fd.append("file", f);
    try { setFiles((await api("/api/docs", { method: "POST", body: fd })).files); }
    catch (e) { alert("Upload failed: " + e.message); }
    finally { setUploading(false); }
  }
  async function del(name) { setFiles((await api(`/api/docs?name=${encodeURIComponent(name)}`, { method: "DELETE" })).files); }

  return (
    <div style={{ maxWidth: 820 }}>
      <h2 className="page-title">📄 Documents</h2>
      <p className="page-sub">Resume, transcript, certifications, SF-86 prep - your important files, stored in the vault (30 - Resources/Personal Docs).</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="card"
        style={{ border: `2px dashed ${drag ? "var(--color-accent)" : "var(--color-border)"}`, background: drag ? "rgba(88,166,255,0.06)" : "var(--color-bg)", padding: "32px 16px", textAlign: "center", cursor: "pointer", marginBottom: 16 }}
      >
        <div style={{ fontSize: 28 }}>⬆</div>
        <div style={{ fontSize: 14, marginTop: 6 }}>{uploading ? "Uploading…" : "Drag & drop documents here, or click to browse"}</div>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4 }}>PDF, DOCX, images</div>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {files.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>No documents yet.</div>
      ) : (
        <div className="card" style={{ padding: 12 }}>
          <table className="sheet">
            <thead><tr><th>File</th><th>Added</th><th style={{ textAlign: "right" }}>Size</th><th></th><th></th></tr></thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.name}>
                  <td>{f.name}</td>
                  <td style={{ color: "var(--color-muted)" }}>{new Date(f.added).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right", color: "var(--color-muted)" }}>{fmtSize(f.size)}</td>
                  <td><a className="btn" style={{ padding: "2px 8px", textDecoration: "none" }} href={`/api/docs/${encodeURIComponent(f.name)}`} target="_blank" rel="noreferrer">Open</a></td>
                  <td><button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => del(f.name)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function fmtSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

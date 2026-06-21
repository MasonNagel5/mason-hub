"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/client";

export default function Materials({ slug }) {
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  async function load() {
    try {
      setFiles((await api(`/api/classes/${slug}/files`)).files);
    } catch {}
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function upload(fileList) {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    const fd = new FormData();
    for (const f of fileList) fd.append("file", f);
    try {
      const r = await api(`/api/classes/${slug}/files`, { method: "POST", body: fd });
      setFiles(r.files);
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? "var(--color-accent)" : "var(--color-border)"}`,
          background: drag ? "rgba(88,166,255,0.06)" : "var(--color-bg)",
          borderRadius: 8,
          padding: "32px 16px",
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 28 }}>⬆</div>
        <div style={{ fontSize: 14, marginTop: 6 }}>
          {uploading ? "Uploading…" : "Drag & drop course materials here, or click to browse"}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4 }}>PDFs, slides, notes, images</div>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {files.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>No files yet.</div>
      ) : (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "var(--color-muted)", fontSize: 11, textTransform: "uppercase" }}>
              <th style={{ textAlign: "left", padding: "4px 0" }}>File</th>
              <th style={{ textAlign: "left" }}>Added</th>
              <th style={{ textAlign: "right" }}>Size</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.name} style={{ borderTop: "1px solid var(--color-border)" }}>
                <td style={{ padding: "6px 0" }}>{f.name}</td>
                <td style={{ color: "var(--color-muted)" }}>{new Date(f.added).toLocaleDateString()}</td>
                <td style={{ textAlign: "right", color: "var(--color-muted)" }}>{fmtSize(f.size)}</td>
                <td style={{ textAlign: "right" }}>
                  <a className="btn" style={{ padding: "2px 8px", textDecoration: "none" }} href={`/api/classes/${slug}/files/${encodeURIComponent(f.name)}`} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function fmtSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

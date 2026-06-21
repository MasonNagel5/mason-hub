"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/client";

// Autosaving markdown notes bound to a whitelisted vault doc (via /api/doc).
export default function DocEditor({ docKey, label = "Notes", minHeight = 320, placeholder }) {
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    api(`/api/doc?key=${docKey}`).then((r) => setValue(r.content || "")).catch(() => {}).finally(() => setLoaded(true));
  }, [docKey]);

  function onChange(v) {
    setValue(v);
    setStatus("saving…");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await api("/api/doc", { method: "PUT", body: JSON.stringify({ key: docKey, content: v }) });
        setStatus("saved ✓");
        setTimeout(() => setStatus(""), 1500);
      } catch { setStatus("save failed"); }
    }, 800);
  }

  if (!loaded) return <div className="card" style={{ padding: 16, fontSize: 13, color: "var(--color-muted)" }}>Loading…</div>;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>{label}</h3>
        <span style={{ fontSize: 12, color: status === "saved ✓" ? "var(--color-green)" : "var(--color-muted)" }}>{status}</span>
      </div>
      <textarea className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ minHeight, resize: "vertical", lineHeight: 1.6, fontFamily: "ui-monospace, monospace", fontSize: 13 }} />
      <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 6 }}>Markdown · saves to your vault automatically.</div>
    </div>
  );
}

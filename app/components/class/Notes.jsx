"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "../../lib/client";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function Notes({ slug }) {
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { content } = await api(`/api/classes/${slug}/notes`);
        setValue(content || "");
      } catch {}
      setLoaded(true);
    })();
  }, [slug]);

  function onChange(v) {
    setValue(v || "");
    setStatus("saving…");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await api(`/api/classes/${slug}/notes`, { method: "PUT", body: JSON.stringify({ content: v || "" }) });
        setStatus("saved ✓");
        setTimeout(() => setStatus(""), 1500);
      } catch {
        setStatus("save failed");
      }
    }, 900);
  }

  if (!loaded) return <div className="card" style={{ padding: 16, fontSize: 13, color: "var(--color-muted)" }}>Loading…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--color-muted)" }}>Auto-saves to <code>notes.md</code> in the vault.</span>
        <span style={{ fontSize: 12, color: status === "saved ✓" ? "var(--color-green)" : "var(--color-muted)" }}>{status}</span>
      </div>
      <div data-color-mode="dark">
        <MDEditor value={value} onChange={onChange} height={520} preview="live" />
      </div>
    </div>
  );
}

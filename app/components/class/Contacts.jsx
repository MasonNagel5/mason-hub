"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/client";

const FIELDS = [
  { key: "professor", label: "Professor" },
  { key: "email", label: "Email" },
  { key: "officeHours", label: "Office Hours" },
  { key: "office", label: "Office Location" },
  { key: "ta", label: "TA (name / email / hours)" },
  { key: "other", label: "Other notes" },
];

export default function Contacts({ slug }) {
  const [data, setData] = useState({});
  const [status, setStatus] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { contacts } = await api(`/api/classes/${slug}/contacts`);
        setData(contacts || {});
      } catch {}
      setLoaded(true);
    })();
  }, [slug]);

  async function save() {
    setStatus("saving…");
    try {
      await api(`/api/classes/${slug}/contacts`, { method: "PUT", body: JSON.stringify(data) });
      setStatus("saved ✓");
      setTimeout(() => setStatus(""), 1500);
    } catch {
      setStatus("save failed");
    }
  }

  if (!loaded) return <div className="card" style={{ padding: 16, fontSize: 13, color: "var(--color-muted)" }}>Loading…</div>;

  return (
    <div className="card" style={{ padding: 16, maxWidth: 620 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Key contacts</h3>
        <span style={{ fontSize: 12, color: status === "saved ✓" ? "var(--color-green)" : "var(--color-muted)" }}>{status}</span>
      </div>
      {FIELDS.map((f) => (
        <div key={f.key} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{f.label}</div>
          {f.key === "other" ? (
            <textarea className="input" rows={3} value={data[f.key] || ""} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} />
          ) : (
            <input className="input" value={data[f.key] || ""} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} />
          )}
        </div>
      ))}
      <button className="btn btn-accent" style={{ marginTop: 16 }} onClick={save}>Save</button>
    </div>
  );
}

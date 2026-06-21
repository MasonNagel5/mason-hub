"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/client";

export default function ProfDevPanel() {
  const [data, setData] = useState({ contacts: [], daily: null });
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [compose, setCompose] = useState(null);

  async function load() {
    try {
      setData(await api("/api/contacts"));
    } catch {}
  }
  useEffect(() => {
    load();
  }, []);

  async function markContacted(id) {
    await api("/api/contacts", { method: "PATCH", body: JSON.stringify({ id, markContacted: true }) });
    load();
  }
  async function addContact() {
    if (!name.trim()) return;
    await api("/api/contacts", { method: "POST", body: JSON.stringify({ name, org }) });
    setName("");
    setOrg("");
    setAdding(false);
    load();
  }
  async function importRoster() {
    setBusy(true);
    try {
      const r = await api("/api/contacts/import", { method: "POST", body: JSON.stringify({}) });
      await load();
      alert(`Imported ${r.added} new contacts (parsed ${r.parsed}).`);
    } catch (e) {
      alert("Import failed: " + e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    await api(`/api/contacts?id=${id}`, { method: "DELETE" });
    load();
  }

  const due = data.contacts.filter((c) => c.dueForFollowUp);
  const d = data.daily;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>🤝 Professional Development</h3>
        <button className="btn" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Hide list" : `All (${data.contacts.length})`}
        </button>
      </div>

      {d ? (
        <div style={{ background: "var(--color-card-2)", borderRadius: 6, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "var(--color-muted)" }}>Today, reach out to</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {d.name}
            {d.org ? <span style={{ color: "var(--color-accent)", fontWeight: 500 }}> · {d.org}</span> : null}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
            {d.last_contact ? `Last contact ${d.daysSince}d ago` : "No contact logged yet"}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button className="btn btn-accent" style={{ padding: "4px 10px" }} onClick={() => setCompose(d)}>
              ✉ Draft outreach
            </button>
            <button className="btn" style={{ padding: "4px 10px" }} onClick={() => markContacted(d.id)}>
              Mark reached out
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 10 }}>
          No contacts yet.{" "}
          <button className="btn" style={{ padding: "2px 8px", fontSize: 12 }} onClick={importRoster} disabled={busy}>
            {busy ? "Importing…" : "Import from 6/20 note"}
          </button>
        </div>
      )}

      {due.length > 0 && (
        <div style={{ fontSize: 12, color: "var(--color-yellow)", marginBottom: 8 }}>
          ⏰ {due.length} contact{due.length > 1 ? "s" : ""} due for follow-up (30+ days)
        </div>
      )}

      {showAll && (
        <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          {data.contacts.map((c) => (
            <div
              key={c.id}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 6px", borderRadius: 4, background: c.dueForFollowUp ? "rgba(210,153,34,0.08)" : "transparent" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                {c.org && <span style={{ color: "var(--color-muted)" }}> · {c.org}</span>}
                <div style={{ color: "var(--color-muted)", fontSize: 11 }}>
                  {c.last_contact ? `${c.daysSince}d ago` : "never"}
                </div>
              </div>
              <button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => setCompose(c)} title="Draft outreach">
                ✉
              </button>
              <button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => markContacted(c.id)} title="Mark contacted">
                ✓
              </button>
              <button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => remove(c.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div style={{ display: "flex", gap: 6 }}>
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Org" value={org} onChange={(e) => setOrg(e.target.value)} style={{ width: 110 }} />
          <button className="btn btn-accent" onClick={addContact}>
            Add
          </button>
        </div>
      ) : (
        <button className="btn" style={{ width: "100%", fontSize: 12 }} onClick={() => setAdding(true)}>
          + Add contact
        </button>
      )}

      {compose && (
        <OutreachModal
          contact={compose}
          onClose={() => setCompose(null)}
          onSent={() => {
            markContacted(compose.id);
            setCompose(null);
          }}
        />
      )}
    </div>
  );
}

function OutreachModal({ contact, onClose, onSent }) {
  const first = (contact.name || "").split(" ")[0];
  const [email, setEmail] = useState("");
  const [detail, setDetail] = useState("");
  const [copied, setCopied] = useState(false);

  const subject = `Reaching out — WSU cybersecurity student`;
  const body = `Hi ${first},

I'm Mason Nagel, a CS junior at Washington State University on a government cybersecurity track (CyberCorps SFS scholar, VICEROY CySER research). ${detail ? detail.trim() + " " : ""}I came across your work${contact.org ? ` at ${contact.org}` : ""} and wanted to connect.

I'd value the chance to hear how you got into the field and any advice you'd share with someone heading into government cyber.

Thanks for your time,
Mason Nagel`;

  function copy() {
    navigator.clipboard.writeText(body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: 520, maxWidth: "100%", padding: 20, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 4px" }}>Outreach to {contact.name}</h3>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 12 }}>{contact.org || "—"}</div>

        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Their email (optional, for one-click send)</div>
        <input className="input" placeholder="name@org.gov" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 10 }} />

        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>One specific detail (the part that makes it personal)</div>
        <input className="input" placeholder="e.g. I read your paper on ICS anomaly detection…" value={detail} onChange={(e) => setDetail(e.target.value)} style={{ marginBottom: 10 }} />

        <textarea className="input" rows={11} value={body} readOnly style={{ resize: "vertical", lineHeight: 1.5, fontSize: 13 }} />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" }}>
          <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy text"}</button>
          <a className="btn" href={mailto} target="_blank" rel="noreferrer" style={{ textDecoration: "none", opacity: email ? 1 : 0.5, pointerEvents: email ? "auto" : "none" }}>Open in email</a>
          <button className="btn btn-accent" onClick={onSent}>Mark contacted today</button>
        </div>
      </div>
    </div>
  );
}

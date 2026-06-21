"use client";

import { useState } from "react";
import { api } from "../lib/client";

export default function FirstLaunch({ status, onClose, onSaved }) {
  const s = status?.settings || {};
  const firstTime = !status?.configured;
  const [vaultPath, setVaultPath] = useState(s.vault_path || "");
  const [name, setName] = useState(s.display_name || "Mason");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      await api("/api/settings", {
        method: "POST",
        body: JSON.stringify({ vault_path: vaultPath, display_name: name, setup_done: "1" }),
      });
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ width: 480, maxWidth: "100%", padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>{firstTime ? "Welcome to your hub" : "Settings"}</h2>
        <p style={{ color: "var(--color-muted)", fontSize: 13, marginTop: 0 }}>
          Everything you do is saved into your second brain vault, so it syncs across your Mac and PC. No accounts, no cloud.
        </p>

        <Field label="Your name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Vault path" hint={status?.vaultExists ? "✓ found" : "⚠ not found at this path - fix it to enable sync"}>
          <input className="input" value={vaultPath} onChange={(e) => setVaultPath(e.target.value)} />
        </Field>
        <p style={{ fontSize: 11, color: "var(--color-muted)" }}>
          On a Mac this will be something like <code>/Users/you/.../Mason-Second-Brain</code>. Point it at the same OneDrive
          vault on each machine and your data follows you.
        </p>

        {err && <div style={{ color: "var(--color-red)", fontSize: 13, marginTop: 8 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          {!firstTime && <button className="btn" onClick={onClose}>Cancel</button>}
          <button className="btn btn-accent" onClick={save} disabled={saving}>{saving ? "Saving…" : firstTime ? "Start" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

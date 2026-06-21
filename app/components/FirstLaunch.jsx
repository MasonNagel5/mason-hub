"use client";

import { useState } from "react";
import { api } from "../lib/client";

export default function FirstLaunch({ status, onClose, onSaved }) {
  const s = status?.settings || {};
  const [vaultPath, setVaultPath] = useState(s.vault_path || "");
  const [pplDay, setPplDay] = useState(status?.pplToday || "Push");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const firstTime = !status?.configured;

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        vault_path: vaultPath,
        pplDay,
      };
      await api("/api/settings", { method: "POST", body: JSON.stringify(payload) });
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 520, maxWidth: "100%", padding: 24, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>
          {firstTime ? "Welcome — quick setup" : "Settings"}
        </h2>
        <p style={{ color: "var(--color-muted)", fontSize: 13, marginTop: 0 }}>
          {firstTime
            ? "Two things and you're in. Everything is stored locally."
            : "Update your vault path and gym rotation."}
        </p>

        <Field label="Vault path" hint={status?.vaultExists ? "✓ found" : "not found at this path"}>
          <input className="input" value={vaultPath} onChange={(e) => setVaultPath(e.target.value)} />
        </Field>

        <Field label="Today's gym day (PPL anchor)" hint="Sets the rotation. Push → Pull → Legs → … → Rest">
          <div style={{ display: "flex", gap: 8 }}>
            {["Push", "Pull", "Legs", "Rest"].map((d) => (
              <button
                key={d}
                className={pplDay === d ? "btn btn-accent" : "btn"}
                style={{ flex: 1 }}
                onClick={() => setPplDay(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        {err && <div style={{ color: "var(--color-red)", fontSize: 13, marginTop: 8 }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          {!firstTime && (
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
          )}
          <button className="btn btn-accent" onClick={save} disabled={saving}>
            {saving ? "Saving…" : firstTime ? "Start" : "Save"}
          </button>
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

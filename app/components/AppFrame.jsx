"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import FirstLaunch from "./FirstLaunch";
import { api } from "../lib/client";

export default function AppFrame({ children }) {
  const [status, setStatus] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  async function refresh() {
    try {
      const s = await api("/api/settings");
      setStatus(s);
      if (!s.configured) setShowSetup(true);
    } catch {
      setStatus({ configured: false, vaultExists: false });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} onOpenSettings={() => setShowSetup(true)} />
      <main style={{ flex: 1, minWidth: 0, padding: "24px 30px" }}>
        {status && !status.vaultExists && (
          <div className="card" style={{ padding: 12, marginBottom: 16, borderColor: "var(--color-red)", color: "var(--color-red)", fontSize: 13 }}>
            ⚠ Vault not found at the configured path. Open Settings (gear, bottom-left) to fix the vault path — data won't save until then.
          </div>
        )}
        {children}
      </main>
      {showSetup && (
        <FirstLaunch status={status} onClose={() => setShowSetup(false)} onSaved={() => { setShowSetup(false); refresh(); }} />
      )}
    </div>
  );
}

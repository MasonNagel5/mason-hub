"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import FirstLaunch from "./FirstLaunch";
import { api } from "../lib/client";

export default function AppFrame({ children }) {
  const [status, setStatus] = useState(null); // settings status
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
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onOpenSettings={() => setShowSetup(true)}
        pplToday={status?.pplToday}
      />
      <main style={{ flex: 1, minWidth: 0, padding: collapsed ? "24px 28px" : "24px 32px" }}>
        {status && !status.vaultExists && (
          <div
            className="card"
            style={{ padding: 12, marginBottom: 16, borderColor: "var(--color-red)", color: "var(--color-red)", fontSize: 13 }}
          >
            ⚠ Vault not found at the configured path. Open Settings to fix the vault path.
          </div>
        )}
        {children}
      </main>
      {showSetup && (
        <FirstLaunch
          status={status}
          onClose={() => setShowSetup(false)}
          onSaved={() => {
            setShowSetup(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

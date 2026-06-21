"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLASSES } from "@/lib/classes.js";
import Pomodoro from "./Pomodoro";

const TABS = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/calendar", label: "Calendar", icon: "▤" },
  { href: "/secplus", label: "Security+", icon: "🎯" },
  { href: "/career", label: "Career", icon: "💼" },
  { href: "/gym", label: "Gym", icon: "🏋" },
];

export default function Sidebar({ collapsed, onToggle, onOpenSettings, pplToday }) {
  const path = usePathname();

  const itemStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: collapsed ? "10px 0" : "8px 12px",
    justifyContent: collapsed ? "center" : "flex-start",
    borderRadius: 6,
    color: active ? "#fff" : "var(--color-muted)",
    background: active ? "var(--color-accent-dim)" : "transparent",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    whiteSpace: "nowrap",
  });

  return (
    <aside
      style={{
        width: collapsed ? 56 : 230,
        flexShrink: 0,
        background: "var(--color-card)",
        borderRight: "1px solid var(--color-border)",
        padding: collapsed ? "16px 8px" : "16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          marginBottom: 14,
        }}
      >
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text)" }}>
            Mason<span style={{ color: "var(--color-accent)" }}>·Hub</span>
          </span>
        )}
        <button className="btn" style={{ padding: "4px 8px" }} onClick={onToggle} title="Collapse">
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {TABS.map((t) => (
        <Link key={t.href} href={t.href} style={itemStyle(path === t.href)}>
          <span style={{ fontSize: 15 }}>{t.icon}</span>
          {!collapsed && t.label}
        </Link>
      ))}

      {!collapsed && (
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--color-muted)", margin: "14px 0 4px 12px" }}>
          Fall 2026 Classes
        </div>
      )}
      {collapsed && <div style={{ height: 1, background: "var(--color-border)", margin: "10px 4px" }} />}

      {CLASSES.map((c) => {
        const href = `/class/${c.slug}`;
        return (
          <Link key={c.slug} href={href} style={itemStyle(path === href)} title={c.name}>
            <span style={{ fontSize: 13 }}>›</span>
            {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>}
          </Link>
        );
      })}

      <div style={{ flex: 1 }} />

      <Pomodoro collapsed={collapsed} />

      {!collapsed && pplToday && (
        <div className="card" style={{ padding: "8px 10px", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "var(--color-muted)" }}>Today's lift: </span>
          <span style={{ color: pplToday === "Rest" ? "var(--color-muted)" : "var(--color-green)", fontWeight: 600 }}>
            {pplToday}
          </span>
        </div>
      )}

      <button className="btn" onClick={onOpenSettings} style={{ width: "100%" }}>
        {collapsed ? "⚙" : "⚙ Settings"}
      </button>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLASSES } from "@/lib/classes.js";

const GROUPS = [
  {
    title: "Daily",
    items: [
      { href: "/", label: "To-Do", icon: "✓" },
      { href: "/study", label: "Study", icon: "📚" },
      { href: "/calendar", label: "Calendar", icon: "🗓" },
      { href: "/journal", label: "Journal", icon: "✍" },
    ],
  },
  {
    title: "Academics",
    items: [
      ...CLASSES.map((c) => ({ href: `/class/${c.slug}`, label: c.short || c.name, icon: "›", title: c.name })),
      { href: "/projects", label: "Projects", icon: "🧩" },
    ],
  },
  {
    title: "Career",
    items: [
      { href: "/jobs", label: "Job Tracker", icon: "🏛" },
      { href: "/networking", label: "Networking", icon: "🤝" },
      { href: "/sfs", label: "SFS", icon: "🎓" },
      { href: "/boeing", label: "Boeing Mentorship", icon: "✈" },
      { href: "/docs", label: "Documents", icon: "📄" },
    ],
  },
  {
    title: "Work",
    items: [
      { href: "/ra", label: "RA", icon: "🏠" },
      { href: "/ambassador", label: "Ambassador", icon: "🎤" },
    ],
  },
  {
    title: "Life",
    items: [
      { href: "/budget", label: "Budget", icon: "💵" },
      { href: "/weight", label: "Weight", icon: "⚖" },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, onOpenSettings }) {
  const path = usePathname();

  const itemStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: collapsed ? "9px 0" : "7px 10px",
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
        width: collapsed ? 56 : 220,
        flexShrink: 0,
        background: "var(--color-card)",
        borderRight: "1px solid var(--color-border)",
        padding: collapsed ? "16px 8px" : "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", marginBottom: 12 }}>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            Mason<span style={{ color: "var(--color-accent)" }}>·Hub</span>
          </span>
        )}
        <button className="btn" style={{ padding: "4px 8px" }} onClick={onToggle} title="Collapse">
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} style={{ marginBottom: 6 }}>
          {!collapsed && (
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--color-muted)", opacity: 0.6, margin: "8px 0 3px 10px" }}>
              {g.title}
            </div>
          )}
          {collapsed && <div style={{ height: 1, background: "var(--color-border)", margin: "8px 4px" }} />}
          {g.items.map((it) => (
            <Link key={it.href} href={it.href} title={it.title || it.label} style={itemStyle(path === it.href)}>
              <span style={{ fontSize: 14, width: 16, textAlign: "center" }}>{it.icon}</span>
              {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>}
            </Link>
          ))}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <button className="btn" onClick={onOpenSettings} style={{ width: "100%" }}>
        {collapsed ? "⚙" : "⚙ Settings"}
      </button>
    </aside>
  );
}

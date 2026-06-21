"use client";

import { useEffect, useState } from "react";
import Clock from "./components/Clock";
import Briefing from "./components/Briefing";
import WeekView from "./components/WeekView";
import MeetingQuickNote from "./components/MeetingQuickNote";
import { api } from "./lib/client";
import { fmtTime } from "@/lib/dates.js";

const SOURCE_TAG = {
  assignment: { label: "Assignment", color: "var(--color-accent)" },
  project: { label: "Project", color: "var(--color-green)" },
  recurring: { label: "Study", color: "var(--color-orange)" },
  inbox: { label: "Inbox", color: "var(--color-yellow)" },
  manual: { label: "Task", color: "var(--color-muted)" },
};

export default function TodoPage() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newDue, setNewDue] = useState("");
  const [view, setView] = useState("today");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [name, setName] = useState("");

  async function loadTasks() {
    const { tasks } = await api("/api/tasks");
    setTasks(tasks);
  }
  async function loadAll() {
    setLoading(true);
    try { await loadTasks(); } catch {}
    try { setEvents((await api("/api/calendar/upcoming?hours=48")).events); } catch {}
    setLoading(false);
  }
  useEffect(() => {
    loadAll();
    api("/api/settings").then((s) => setName(s.settings?.display_name || "")).catch(() => {});
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return name ? `${part}, ${name}` : part;
  })();

  async function toggle(t) {
    setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    try { await api(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ done: !t.done }) }); }
    catch { loadTasks(); }
  }
  async function addTask() {
    if (!newTask.trim()) return;
    const due = newDue ? new Date(`${newDue}T17:00`).toISOString() : null;
    await api("/api/tasks", { method: "POST", body: JSON.stringify({ title: newTask, due }) });
    setNewTask(""); setNewDue("");
    loadTasks();
  }
  async function del(id) { await api(`/api/tasks/${id}`, { method: "DELETE" }); loadTasks(); }
  async function writeSummary() {
    const r = await api("/api/daily-summary", { method: "POST" });
    setMsg(`Logged ${r.count} completed task${r.count === 1 ? "" : "s"} to today's daily note.`);
    setTimeout(() => setMsg(null), 4000);
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div>
      <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 4 }}>{greeting}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <Clock />
        <div style={{ display: "flex", gap: 8 }}>
          <MeetingQuickNote />
          <button className="btn btn-accent" onClick={writeSummary} title="Write today's completed tasks to the daily note">🌙 End-of-day summary</button>
        </div>
      </div>
      {msg && <div className="card" style={{ padding: 10, marginBottom: 16, borderColor: "var(--color-green)", color: "var(--color-green)", fontSize: 13 }}>{msg}</div>}

      <Briefing />

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <button className={`subtab ${view === "today" ? "active" : ""}`} onClick={() => setView("today")}>Today</button>
              <button className={`subtab ${view === "week" ? "active" : ""}`} onClick={() => setView("week")}>This Week</button>
            </div>
            {view === "today" && <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{open.length} open · {done.length} done</span>}
          </div>

          {view === "week" ? (
            <WeekView />
          ) : (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <input className="input" placeholder="Add a task…" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
                <input className="input" type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} style={{ width: 150 }} title="Optional due date" />
                <button className="btn btn-accent" onClick={addTask}>Add</button>
              </div>

              {loading && <div style={{ color: "var(--color-muted)", fontSize: 13 }}>Loading…</div>}
              {!loading && tasks.length === 0 && <div style={{ color: "var(--color-muted)", fontSize: 13 }}>Nothing yet. Add a task above - it saves straight to your vault.</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {open.map((t) => <TaskRow key={t.id} t={t} onToggle={toggle} onDelete={del} />)}
              </div>
              {done.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: "var(--color-muted)", margin: "16px 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>Completed today</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {done.map((t) => <TaskRow key={t.id} t={t} onToggle={toggle} onDelete={del} />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>📅 Next 48 hours</h3>
          {events.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-muted)" }}>Nothing scheduled.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {events.slice(0, 10).map((e) => (
                <div key={e.id} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                  <div style={{ width: 4, borderRadius: 2, background: srcColor(e.source) }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{e.title}</div>
                    <div style={{ color: "var(--color-muted)", fontSize: 12 }}>
                      {new Date(e.start).toLocaleDateString([], { weekday: "short" })} {fmtTime(e.start)}{e.className ? ` · ${e.className}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function srcColor(s) {
  return { assignment: "var(--color-accent)", shift: "var(--color-orange)", manual: "var(--color-green)" }[s] || "var(--color-muted)";
}

function TaskRow({ t, onToggle, onDelete }) {
  const tag = SOURCE_TAG[t.source] || SOURCE_TAG.manual;
  const overdue = t.due && !t.done && new Date(t.due) < new Date();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="checkbox" checked={t.done} onChange={() => onToggle(t)} style={{ width: 16, height: 16, accentColor: "var(--color-accent)", cursor: "pointer" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, textDecoration: t.done ? "line-through" : "none", color: t.done ? "var(--color-muted)" : "var(--color-text)" }}>{t.title}</span>
        {t.due && <span style={{ fontSize: 11, marginLeft: 8, color: overdue ? "var(--color-red)" : "var(--color-muted)" }}>{new Date(t.due).toLocaleDateString([], { month: "short", day: "numeric" })}</span>}
      </div>
      <span className="tag" style={{ color: tag.color, borderColor: tag.color }}>{tag.label}</span>
      {t.source === "manual" && <button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => onDelete(t.id)}>✕</button>}
    </div>
  );
}

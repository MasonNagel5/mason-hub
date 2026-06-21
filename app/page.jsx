"use client";

import { useEffect, useState } from "react";
import Clock from "./components/Clock";
import ProfDevPanel from "./components/ProfDevPanel";
import Briefing from "./components/Briefing";
import WeekView from "./components/WeekView";
import MeetingQuickNote from "./components/MeetingQuickNote";
import { api } from "./lib/client";
import { fmtTime } from "@/lib/dates.js";

const SOURCE_TAG = {
  assignment: { label: "Assignment", color: "var(--color-accent)" },
  project: { label: "Project", color: "var(--color-green)" },
  recurring: { label: "Routine", color: "var(--color-orange)" },
  inbox: { label: "Inbox", color: "var(--color-yellow)" },
  manual: { label: "Manual", color: "var(--color-muted)" },
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [inboxItem, setInboxItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [summaryMsg, setSummaryMsg] = useState(null);
  const [view, setView] = useState("today"); // today | week

  async function loadTasks() {
    const { tasks } = await api("/api/tasks");
    setTasks(tasks);
  }
  async function loadAll() {
    setLoading(true);
    try {
      await loadTasks();
    } catch {}
    try {
      const { events } = await api("/api/calendar/upcoming?hours=48");
      setEvents(events);
    } catch {}
    try {
      const { projects } = await api("/api/projects");
      setProjects(projects);
    } catch {}
    setLoading(false);
  }
  useEffect(() => {
    loadAll();
  }, []);

  async function toggle(t) {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    try {
      await api(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ done: !t.done }) });
    } catch {
      loadTasks();
    }
  }
  async function addTask() {
    if (!newTask.trim()) return;
    await api("/api/tasks", { method: "POST", body: JSON.stringify({ title: newTask }) });
    setNewTask("");
    loadTasks();
  }
  async function deleteTask(id) {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  }
  async function addInbox() {
    if (!inboxItem.trim()) return;
    await api("/api/inbox", { method: "POST", body: JSON.stringify({ item: inboxItem }) });
    setInboxItem("");
    loadTasks();
  }
  async function writeSummary() {
    const r = await api("/api/daily-summary", { method: "POST" });
    setSummaryMsg(`Wrote ${r.count} completed task${r.count === 1 ? "" : "s"} to today's daily note.`);
    setTimeout(() => setSummaryMsg(null), 4000);
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <Clock />
        <div style={{ display: "flex", gap: 8 }}>
          <MeetingQuickNote />
          <button className="btn btn-accent" onClick={writeSummary} title="Write today's completed tasks to the daily note">
            🌙 End-of-day summary
          </button>
        </div>
      </div>
      {summaryMsg && (
        <div className="card" style={{ padding: 10, marginBottom: 16, borderColor: "var(--color-green)", color: "var(--color-green)", fontSize: 13 }}>
          {summaryMsg}
        </div>
      )}

      <Briefing />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, alignItems: "start" }}>
        {/* LEFT: tasks */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={view === "today" ? "btn btn-accent" : "btn"} style={{ padding: "4px 10px", fontSize: 13 }} onClick={() => setView("today")}>✅ Today</button>
              <button className={view === "week" ? "btn btn-accent" : "btn"} style={{ padding: "4px 10px", fontSize: 13 }} onClick={() => setView("week")}>🗓 This Week</button>
            </div>
            {view === "today" && (
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                {open.length} open · {done.length} done
              </span>
            )}
          </div>

          {view === "week" ? (
            <WeekView />
          ) : (
          <>

          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <input
              className="input"
              placeholder="Add a task…"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
            <button className="btn btn-accent" onClick={addTask}>
              Add
            </button>
          </div>

          {loading && <div style={{ color: "var(--color-muted)", fontSize: 13 }}>Loading…</div>}
          {!loading && open.length === 0 && done.length === 0 && (
            <div style={{ color: "var(--color-muted)", fontSize: 13 }}>No tasks. Add one above.</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {open.map((t) => (
              <TaskRow key={t.id} t={t} onToggle={toggle} onDelete={deleteTask} />
            ))}
          </div>

          {done.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "var(--color-muted)", margin: "16px 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>
                Completed today
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {done.map((t) => (
                  <TaskRow key={t.id} t={t} onToggle={toggle} onDelete={deleteTask} />
                ))}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 6, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
            <input
              className="input"
              placeholder="Dump to vault inbox…"
              value={inboxItem}
              onChange={(e) => setInboxItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addInbox()}
            />
            <button className="btn" onClick={addInbox}>
              → Inbox
            </button>
          </div>
          </>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>📅 Next 48 hours</h3>
            {events.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--color-muted)" }}>Nothing scheduled.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {events.slice(0, 8).map((e) => (
                  <div key={e.id} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                    <div style={{ width: 4, borderRadius: 2, background: srcColor(e.source) }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{e.title}</div>
                      <div style={{ color: "var(--color-muted)", fontSize: 12 }}>
                        {new Date(e.start).toLocaleDateString([], { weekday: "short" })} {fmtTime(e.start)}
                        {e.className ? ` · ${e.className}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ProfDevPanel />

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>📂 Active Projects</h3>
            {projects.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--color-muted)" }}>No projects found in the vault.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.map((p) => (
                  <div key={p.folder} style={{ fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{p.title}</span>
                      {p.status && <span style={{ fontSize: 11, whiteSpace: "nowrap" }}>{p.status}</span>}
                    </div>
                    {p.nextAction && (
                      <div style={{ color: "var(--color-muted)", fontSize: 12, marginTop: 1 }}>→ {p.nextAction}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function srcColor(source) {
  return { assignment: "var(--color-accent)", shift: "var(--color-orange)", manual: "var(--color-green)" }[source] || "var(--color-muted)";
}

function TaskRow({ t, onToggle, onDelete }) {
  const tag = SOURCE_TAG[t.source] || SOURCE_TAG.manual;
  const overdue = t.due && !t.done && new Date(t.due) < new Date();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="checkbox" checked={t.done} onChange={() => onToggle(t)} style={{ width: 16, height: 16, accentColor: "var(--color-accent)", cursor: "pointer" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, textDecoration: t.done ? "line-through" : "none", color: t.done ? "var(--color-muted)" : "var(--color-text)" }}>
          {t.meta?.url ? (
            <a href={t.meta.url} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
              {t.title}
            </a>
          ) : (
            t.title
          )}
        </span>
        {t.due && (
          <span style={{ fontSize: 11, marginLeft: 8, color: overdue ? "var(--color-red)" : "var(--color-muted)" }}>
            {new Date(t.due).toLocaleDateString([], { month: "short", day: "numeric" })} {fmtTime(t.due)}
          </span>
        )}
      </div>
      <span className="tag" style={{ color: tag.color, borderColor: tag.color }}>
        {tag.label}
      </span>
      {(t.source === "manual") && (
        <button className="btn" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => onDelete(t.id)}>
          ✕
        </button>
      )}
    </div>
  );
}

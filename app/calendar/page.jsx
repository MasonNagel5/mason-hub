"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/client";
import { startOfWeek, addDays, ymd, fmtTime } from "@/lib/dates.js";

const SRC = {
  assignment: { color: "var(--color-accent)", label: "Assignment" },
  shift: { color: "var(--color-orange)", label: "RA Work" },
  manual: { color: "var(--color-green)", label: "Event" },
  task: { color: "var(--color-yellow)", label: "Task" },
};

export default function CalendarPage() {
  const [view, setView] = useState("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [detail, setDetail] = useState(null);
  const [showEvent, setShowEvent] = useState(false);
  const [showShift, setShowShift] = useState(false);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => computeRange(view, anchor), [view, anchor]);

  async function load() {
    setLoading(true);
    try {
      const { events } = await api(
        `/api/calendar?start=${range.start.toISOString()}&end=${range.end.toISOString()}`
      );
      setEvents(events);
    } catch {
      setEvents([]);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start.getTime(), range.end.getTime()]);

  function shift(dir) {
    setAnchor((a) => addDays(a, dir * (view === "week" ? 7 : 30)));
  }

  const byDay = useMemo(() => groupByDay(events), [events]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>{range.title}</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn" onClick={() => shift(-1)}>‹</button>
          <button className="btn" onClick={() => setAnchor(new Date())}>Today</button>
          <button className="btn" onClick={() => shift(1)}>›</button>
          <div style={{ width: 1, height: 22, background: "var(--color-border)", margin: "0 4px" }} />
          <button className={view === "week" ? "btn btn-accent" : "btn"} onClick={() => setView("week")}>Week</button>
          <button className={view === "month" ? "btn btn-accent" : "btn"} onClick={() => setView("month")}>Month</button>
          <div style={{ width: 1, height: 22, background: "var(--color-border)", margin: "0 4px" }} />
          <button className="btn" onClick={() => setShowShift(true)}>+ Shift</button>
          <button className="btn btn-accent" onClick={() => setShowEvent(true)}>+ Event</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 12 }}>
        {Object.entries(SRC).map(([k, v]) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: v.color, display: "inline-block" }} />
            {v.label}
          </span>
        ))}
        {loading && <span style={{ color: "var(--color-muted)" }}>· loading…</span>}
      </div>

      {view === "week" ? (
        <WeekView range={range} byDay={byDay} onClick={setDetail} />
      ) : (
        <MonthView range={range} anchor={anchor} byDay={byDay} onClick={setDetail} />
      )}

      {detail && <DetailModal e={detail} onClose={() => setDetail(null)} onChanged={load} />}
      {showEvent && <EventModal onClose={() => setShowEvent(false)} onSaved={() => { setShowEvent(false); load(); }} />}
      {showShift && <ShiftModal onClose={() => setShowShift(false)} onSaved={() => { setShowShift(false); load(); }} />}
    </div>
  );
}

function EventChip({ e, onClick }) {
  const c = SRC[e.source]?.color || "var(--color-muted)";
  return (
    <button
      onClick={() => onClick(e)}
      style={{
        textAlign: "left",
        background: "var(--color-card-2)",
        borderLeft: `3px solid ${c}`,
        border: "1px solid var(--color-border)",
        borderLeftWidth: 3,
        borderLeftColor: c,
        borderRadius: 4,
        padding: "3px 6px",
        cursor: "pointer",
        width: "100%",
        color: "var(--color-text)",
      }}
    >
      <div style={{ fontSize: 11.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {e.title}
      </div>
      <div style={{ fontSize: 10, color: "var(--color-muted)" }}>{fmtTime(e.start)}</div>
    </button>
  );
}

function WeekView({ range, byDay, onClick }) {
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDays(range.start, i));
  const todayStr = ymd();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
      {days.map((d) => {
        const key = ymd(d);
        const isToday = key === todayStr;
        return (
          <div key={key} className="card" style={{ padding: 8, minHeight: 360, borderColor: isToday ? "var(--color-accent)" : "var(--color-border)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: isToday ? "var(--color-accent)" : "var(--color-text)" }}>
              {d.toLocaleDateString([], { weekday: "short" })} {d.getDate()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {(byDay[key] || []).map((e) => (
                <EventChip key={e.id} e={e} onClick={onClick} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ range, anchor, byDay, onClick }) {
  const weeks = [];
  let cur = new Date(range.start);
  while (cur <= range.end) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    weeks.push(row);
  }
  const month = anchor.getMonth();
  const todayStr = ymd();
  return (
    <div className="card" style={{ padding: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ fontSize: 11, color: "var(--color-muted)", textAlign: "center", fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {weeks.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {row.map((d) => {
              const key = ymd(d);
              const dim = d.getMonth() !== month;
              const isToday = key === todayStr;
              const items = byDay[key] || [];
              return (
                <div key={key} style={{ minHeight: 116, background: "var(--color-bg)", border: `1px solid ${isToday ? "var(--color-accent)" : "var(--color-border)"}`, borderRadius: 4, padding: 5, opacity: dim ? 0.45 : 1 }}>
                  <div style={{ fontSize: 11, color: isToday ? "var(--color-accent)" : "var(--color-muted)", fontWeight: 600, marginBottom: 2 }}>{d.getDate()}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {items.slice(0, 4).map((e) => (
                      <button key={e.id} onClick={() => onClick(e)} style={{ textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex", gap: 4, alignItems: "center" }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: SRC[e.source]?.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10.5, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                      </button>
                    ))}
                    {items.length > 4 && <span style={{ fontSize: 10, color: "var(--color-muted)" }}>+{items.length - 4} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailModal({ e, onClose, onChanged }) {
  async function del() {
    if (e.source === "manual") await api(`/api/events?id=${e.id.replace("event-", "")}`, { method: "DELETE" });
    else if (e.source === "shift") await api(`/api/shifts?id=${String(e.id).split("-")[1]}`, { method: "DELETE" });
    onClose();
    onChanged();
  }
  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: SRC[e.source]?.color }} />
        <span className="tag" style={{ color: SRC[e.source]?.color, borderColor: SRC[e.source]?.color }}>{SRC[e.source]?.label}</span>
      </div>
      <h3 style={{ margin: "0 0 6px" }}>{e.title}</h3>
      <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
        {new Date(e.start).toLocaleString([], { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        {e.end ? ` – ${fmtTime(e.end)}` : ""}
      </div>
      {e.className && <div style={{ fontSize: 13, marginTop: 8 }}>Class: {e.className}</div>}
      {e.status && e.source === "assignment" && <div style={{ fontSize: 13 }}>Status: {e.status}</div>}
      {e.points != null && <div style={{ fontSize: 13 }}>Points: {e.points}</div>}
      {e.location && <div style={{ fontSize: 13, marginTop: 8 }}>📍 {e.location}</div>}
      {e.notes && <div style={{ fontSize: 13, marginTop: 8, whiteSpace: "pre-wrap" }}>{e.notes}</div>}
      {e.source === "assignment" && (
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 10 }}>Manage this assignment from its class tab.</div>
      )}
      {(e.source === "manual" || e.source === "shift") && (
        <button className="btn" style={{ marginTop: 12, marginLeft: 8, borderColor: "var(--color-red)", color: "var(--color-red)" }} onClick={del}>
          Delete
        </button>
      )}
    </Modal>
  );
}

function EventModal({ onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(ymd());
  const [time, setTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  async function save() {
    if (!title.trim()) return;
    const start = new Date(`${date}T${time}`).toISOString();
    const end = new Date(`${date}T${endTime}`).toISOString();
    await api("/api/events", { method: "POST", body: JSON.stringify({ title, start, end, location, notes }) });
    onSaved();
  }
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>New event</h3>
      <L label="Title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></L>
      <L label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></L>
      <div style={{ display: "flex", gap: 10 }}>
        <L label="Start"><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></L>
        <L label="End"><input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></L>
      </div>
      <L label="Location"><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} /></L>
      <L label="Notes"><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></L>
      <ModalActions onClose={onClose} onSave={save} />
    </Modal>
  );
}

function ShiftModal({ onClose, onSaved }) {
  const [mode, setMode] = useState("recurring");
  const [title, setTitle] = useState("RA Shift");
  const [weekday, setWeekday] = useState(1);
  const [date, setDate] = useState(ymd());
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("22:00");
  const [notes, setNotes] = useState("");
  async function save() {
    if (mode === "recurring") {
      await api("/api/shifts", { method: "POST", body: JSON.stringify({ title, recurring: true, weekday, start_time: start, end_time: end, notes }) });
    } else {
      await api("/api/shifts", {
        method: "POST",
        body: JSON.stringify({ title, recurring: false, start: new Date(`${date}T${start}`).toISOString(), end: new Date(`${date}T${end}`).toISOString(), notes }),
      });
    }
    onSaved();
  }
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>Add RA shift</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button className={mode === "recurring" ? "btn btn-accent" : "btn"} style={{ flex: 1 }} onClick={() => setMode("recurring")}>Weekly recurring</button>
        <button className={mode === "oneoff" ? "btn btn-accent" : "btn"} style={{ flex: 1 }} onClick={() => setMode("oneoff")}>One-off</button>
      </div>
      <L label="Title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></L>
      {mode === "recurring" ? (
        <L label="Weekday">
          <select className="input" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </L>
      ) : (
        <L label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></L>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <L label="Start"><input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></L>
        <L label="End"><input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></L>
      </div>
      <L label="Notes"><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></L>
      <ModalActions onClose={onClose} onSave={save} />
    </Modal>
  );
}

// ---- shared modal bits ----
function Modal({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: 460, maxWidth: "100%", padding: 22, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function L({ label, children }) {
  return (
    <div style={{ marginTop: 10, flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}
function ModalActions({ onClose, onSave }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-accent" onClick={onSave}>Save</button>
    </div>
  );
}

// ---- helpers ----
function computeRange(view, anchor) {
  if (view === "week") {
    const start = startOfWeek(anchor);
    const end = addDays(start, 6);
    end.setHours(23, 59, 59);
    return { start, end, title: `Week of ${start.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}` };
  }
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const start = startOfWeek(first);
  const end = addDays(startOfWeek(last), 6);
  end.setHours(23, 59, 59);
  return { start, end, title: anchor.toLocaleDateString([], { month: "long", year: "numeric" }) };
}
function groupByDay(events) {
  const map = {};
  for (const e of events) {
    const key = ymd(new Date(e.start));
    (map[key] ||= []).push(e);
  }
  return map;
}

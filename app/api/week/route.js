import { NextResponse } from "next/server";
import { getCalendar } from "@/lib/calendar.js";
import { getDb } from "@/lib/db.js";
import { ymd, addDays } from "@/lib/dates.js";

// Next 7 days, grouped by day: calendar items (assignments, shifts, events)
// plus any manual tasks that carry a due date in range.
export async function GET() {
  const now = new Date();
  const end = addDays(now, 7);
  const items = await getCalendar(now.toISOString(), end.toISOString());

  // Manual tasks with a due date in the window.
  const startStr = ymd(now);
  const endStr = ymd(end);
  const tasks = getDb()
    .prepare("SELECT * FROM tasks WHERE source = 'manual' AND due IS NOT NULL AND substr(due,1,10) BETWEEN ? AND ?")
    .all(startStr, endStr);
  for (const t of tasks) {
    items.push({ id: `task-${t.id}`, source: "task", title: t.title, start: t.due, done: !!t.done });
  }

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(now, i);
    const key = ymd(d);
    days.push({
      date: key,
      label: d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
      items: items
        .filter((it) => ymd(new Date(it.start)) === key)
        .sort((a, b) => new Date(a.start) - new Date(b.start)),
    });
  }
  return NextResponse.json({ days });
}

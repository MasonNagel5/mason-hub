// Local-date helpers. We key everything off the user's local day.

export function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmd(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Whole days between two YYYY-MM-DD strings (b - a), ignoring time/DST.
export function daysBetween(aYmd, bYmd) {
  const a = parseYmd(aYmd);
  const b = parseYmd(bYmd);
  const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(ms / 86400000);
}

// Local "YYYY-MM-DD HH:MM:SS" — used for done_at so date comparisons against
// ymd() stay on the user's local day (toISOString would shift to UTC).
export function nowLocalStamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d = new Date()) {
  // Sunday as start of week.
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

export function fmtTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function fmtDateLong(d = new Date()) {
  return new Date(d).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

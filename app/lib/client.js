"use client";

export async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
    ...opts,
  });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const SOURCE_COLORS = {
  assignment: "var(--color-accent)",
  shift: "var(--color-orange)",
  manual: "var(--color-green)",
};

export const SOURCE_LABELS = {
  assignment: "Assignment",
  shift: "RA Work",
  manual: "Manual",
};

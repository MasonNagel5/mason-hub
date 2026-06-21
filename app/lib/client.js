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

// Vault-backed collection helpers.
export const store = {
  list: (name) => api(`/api/store/${name}`).then((r) => r.items),
  add: (name, item) => api(`/api/store/${name}`, { method: "POST", body: JSON.stringify({ item }) }),
  update: (name, id, patch) => api(`/api/store/${name}`, { method: "PATCH", body: JSON.stringify({ id, patch }) }),
  remove: (name, id) => api(`/api/store/${name}?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  replace: (name, arr) => api(`/api/store/${name}`, { method: "POST", body: JSON.stringify({ replaceAll: arr }) }),
};

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

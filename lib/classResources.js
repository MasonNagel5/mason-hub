import { getDb } from "./db.js";

export function listResources(classSlug) {
  return getDb()
    .prepare("SELECT * FROM class_resources WHERE class_slug = ? ORDER BY kind, id DESC")
    .all(classSlug);
}

export function addResource({ classSlug, label, url, kind, notes }) {
  const info = getDb()
    .prepare("INSERT INTO class_resources (class_slug, label, url, kind, notes) VALUES (?, ?, ?, ?, ?)")
    .run(classSlug, label.trim(), url || null, kind || "link", notes || null);
  return info.lastInsertRowid;
}

export function deleteResource(id) {
  getDb().prepare("DELETE FROM class_resources WHERE id = ?").run(id);
}

// Sensible starter resources seeded from the vault's Fall 2026 Classes note.
const SEED = {
  "systems-programming": [
    { label: "CSAPP — Computer Systems: A Programmer's Perspective", kind: "textbook" },
    { label: "OSTEP — Operating Systems: Three Easy Pieces", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", kind: "textbook" },
    { label: "Essential C (Stanford, Parlante)", url: "http://cslibrary.stanford.edu/101/EssentialC.pdf", kind: "reference" },
    { label: "learn-c.org interactive tutorial", url: "https://www.learn-c.org", kind: "tool" },
    { label: "CptS 360 course GitBook", url: "https://wsucpts.gitbook.io/cpts360sp25", kind: "link" },
    { label: "Linux Kernel Documentation", url: "https://www.kernel.org/doc/html/latest/index.html", kind: "reference" },
  ],
  "cyber-security-cryptography": [
    { label: "Professor Messer SY0-701 (overlaps this course)", url: "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/", kind: "reference" },
    { label: "Security+ Study Notes (vault)", kind: "reference", notes: "30 - Resources/30.1 - Cybersecurity/Security+ Study Notes" },
  ],
};

export function seedResources(classSlug) {
  const db = getDb();
  const existing = db.prepare("SELECT COUNT(*) AS n FROM class_resources WHERE class_slug = ?").get(classSlug);
  if (existing.n > 0) return 0;
  const rows = SEED[classSlug];
  if (!rows) return 0;
  const insert = db.prepare("INSERT INTO class_resources (class_slug, label, url, kind, notes) VALUES (?, ?, ?, ?, ?)");
  const tx = db.transaction((items) => items.forEach((r) => insert.run(classSlug, r.label, r.url || null, r.kind || "link", r.notes || null)));
  tx(rows);
  return rows.length;
}

export function hasSeed(classSlug) {
  return !!SEED[classSlug];
}

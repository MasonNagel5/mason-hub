import { listItems, addItem, deleteItem } from "./store.js";

// Class resources - stored in the vault (collection "class_resources").
const COL = "class_resources";

export function listResources(classSlug) {
  return listItems(COL)
    .filter((r) => r.class_slug === classSlug)
    .sort((a, b) => (a.kind || "").localeCompare(b.kind || ""));
}

export function addResource({ classSlug, label, url, kind, notes }) {
  return addItem(COL, { class_slug: classSlug, label: label.trim(), url: url || null, kind: kind || "link", notes: notes || null }).id;
}

export function deleteResource(id) {
  deleteItem(COL, id);
}

const SEED = {
  "systems-programming": [
    { label: "CSAPP - Computer Systems: A Programmer's Perspective", kind: "textbook" },
    { label: "OSTEP - Operating Systems: Three Easy Pieces", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", kind: "textbook" },
    { label: "Essential C (Stanford, Parlante)", url: "http://cslibrary.stanford.edu/101/EssentialC.pdf", kind: "reference" },
    { label: "learn-c.org interactive tutorial", url: "https://www.learn-c.org", kind: "tool" },
    { label: "CptS 360 course GitBook", url: "https://wsucpts.gitbook.io/cpts360sp25", kind: "link" },
    { label: "Linux Kernel Documentation", url: "https://www.kernel.org/doc/html/latest/index.html", kind: "reference" },
  ],
  "cyber-security-cryptography": [
    { label: "Professor Messer SY0-701 (overlaps this course)", url: "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/", kind: "reference" },
  ],
};

export function seedResources(classSlug) {
  if (listResources(classSlug).length > 0) return 0;
  const rows = SEED[classSlug];
  if (!rows) return 0;
  for (const r of rows) addResource({ classSlug, ...r });
  return rows.length;
}

export function hasSeed(classSlug) {
  return !!SEED[classSlug];
}

import { getDb } from "./db.js";

// ---------------- Government / job application tracker ----------------

export function listApplications() {
  return getDb()
    .prepare("SELECT * FROM gov_applications ORDER BY (deadline IS NULL), deadline ASC, id DESC")
    .all();
}

export function addApplication(b) {
  const info = getDb()
    .prepare(
      "INSERT INTO gov_applications (agency, role, applied_date, status, next_action, deadline, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(b.agency.trim(), b.role || null, b.applied_date || null, b.status || "interested", b.next_action || null, b.deadline || null, b.url || null, b.notes || null);
  return info.lastInsertRowid;
}

export function updateApplication(id, b) {
  const db = getDb();
  const r = db.prepare("SELECT * FROM gov_applications WHERE id = ?").get(id);
  if (!r) return null;
  db.prepare(
    "UPDATE gov_applications SET agency=COALESCE(?,agency), role=?, applied_date=?, status=COALESCE(?,status), next_action=?, deadline=?, url=?, notes=? WHERE id=?"
  ).run(
    b.agency ?? null,
    b.role !== undefined ? b.role : r.role,
    b.applied_date !== undefined ? b.applied_date : r.applied_date,
    b.status ?? null,
    b.next_action !== undefined ? b.next_action : r.next_action,
    b.deadline !== undefined ? b.deadline : r.deadline,
    b.url !== undefined ? b.url : r.url,
    b.notes !== undefined ? b.notes : r.notes,
    id
  );
  return db.prepare("SELECT * FROM gov_applications WHERE id = ?").get(id);
}

export function deleteApplication(id) {
  getDb().prepare("DELETE FROM gov_applications WHERE id = ?").run(id);
}

// ---------------- Clearance-track checklist ----------------

// Seeded once, tailored to an SFS / clearance-track student.
const CLEARANCE_SEED = [
  { category: "Financial responsibility", label: "No unpaid/collections debt; credit in good standing" },
  { category: "Financial responsibility", label: "File taxes on time every year" },
  { category: "Financial responsibility", label: "Keep documentation for any large deposits/transactions" },
  { category: "Foreign contacts", label: "Track close/continuing foreign national contacts" },
  { category: "Foreign contacts", label: "Log foreign travel (dates, countries, purpose)" },
  { category: "Foreign contacts", label: "Note any foreign financial interests" },
  { category: "Social media hygiene", label: "Audit public posts; remove anything that reads badly" },
  { category: "Social media hygiene", label: "No association with extremist/illegal content or groups" },
  { category: "Substance & conduct", label: "No illegal drug use (incl. cannabis — still federal Schedule I)" },
  { category: "Substance & conduct", label: "Responsible alcohol use; no related incidents" },
  { category: "Employment & residence", label: "Maintain consistent employment/education history (no unexplained gaps)" },
  { category: "Employment & residence", label: "Keep an accurate residence history with addresses + dates" },
  { category: "Personal conduct", label: "Always be truthful on SF-86 — omissions are worse than the facts" },
  { category: "Personal conduct", label: "Identify references who've known you 3+ years" },
];

export function listClearance() {
  const db = getDb();
  if (db.prepare("SELECT COUNT(*) AS n FROM clearance_items").get().n === 0) {
    const insert = db.prepare("INSERT INTO clearance_items (category, label, sort, seeded) VALUES (?, ?, ?, 1)");
    const tx = db.transaction(() => CLEARANCE_SEED.forEach((it, i) => insert.run(it.category, it.label, i)));
    tx();
  }
  return db.prepare("SELECT * FROM clearance_items ORDER BY sort, id").all();
}

export function addClearanceItem(category, label) {
  const max = getDb().prepare("SELECT COALESCE(MAX(sort),0) AS m FROM clearance_items").get().m;
  getDb().prepare("INSERT INTO clearance_items (category, label, sort) VALUES (?, ?, ?)").run(category || "Other", label.trim(), max + 1);
}

export function setClearanceDone(id, done) {
  getDb().prepare("UPDATE clearance_items SET done = ? WHERE id = ?").run(done ? 1 : 0, id);
}

export function deleteClearanceItem(id) {
  getDb().prepare("DELETE FROM clearance_items WHERE id = ?").run(id);
}

// ---------------- Resume bullet builder ----------------

export function listBullets() {
  return getDb().prepare("SELECT * FROM resume_bullets ORDER BY ready DESC, id DESC").all();
}

function assembleXYZ({ what, metric, method }) {
  // XYZ: "Accomplished [X] as measured by [Y] by doing [Z]."
  const x = (what || "").trim().replace(/\.$/, "");
  const y = (metric || "").trim().replace(/\.$/, "");
  const z = (method || "").trim().replace(/\.$/, "");
  if (!x) return "";
  let s = x;
  if (y) s += `, as measured by ${y}`;
  if (z) s += `, by ${z}`;
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

export function addBullet(b) {
  const xyz = assembleXYZ(b);
  const info = getDb()
    .prepare("INSERT INTO resume_bullets (context, raw, what, metric, method, xyz, ready) VALUES (?, ?, ?, ?, ?, ?, 0)")
    .run(b.context || "SWE Internship", b.raw || "", b.what || null, b.metric || null, b.method || null, xyz);
  return info.lastInsertRowid;
}

export function updateBullet(id, b) {
  const db = getDb();
  const r = db.prepare("SELECT * FROM resume_bullets WHERE id = ?").get(id);
  if (!r) return null;
  const merged = {
    what: b.what !== undefined ? b.what : r.what,
    metric: b.metric !== undefined ? b.metric : r.metric,
    method: b.method !== undefined ? b.method : r.method,
  };
  const xyz = assembleXYZ(merged);
  db.prepare(
    "UPDATE resume_bullets SET raw=COALESCE(?,raw), what=?, metric=?, method=?, xyz=?, ready=COALESCE(?,ready) WHERE id=?"
  ).run(b.raw ?? null, merged.what, merged.metric, merged.method, xyz, b.ready != null ? (b.ready ? 1 : 0) : null, id);
  return db.prepare("SELECT * FROM resume_bullets WHERE id = ?").get(id);
}

export function deleteBullet(id) {
  getDb().prepare("DELETE FROM resume_bullets WHERE id = ?").run(id);
}

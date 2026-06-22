import fs from "node:fs";
import path from "node:path";
import { vaultPath } from "./settings.js";
import { ymd, parseYmd, addDays } from "./dates.js";

const DAILY_DIR = "60 - Daily Notes";
const TEMPLATE = "50 - Templates/Daily Note.md";
const PROJECTS_DIR = "10 - Projects";
const INBOX = "00 - Inbox/Inbox.md";
const RESOURCES_DIR = "30 - Resources";

function vpath(...parts) {
  return path.join(vaultPath(), ...parts);
}

// Generic read/write/append for an arbitrary path inside the vault. Used by
// feature tabs to keep human-readable markdown mirrors in the brain.
export function readVaultFile(relPath) {
  const p = path.join(vaultPath(), relPath);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

export function writeVaultFile(relPath, content) {
  const p = path.join(vaultPath(), relPath);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content ?? "", "utf8");
  return path.relative(vaultPath(), p);
}

export function appendVaultFile(relPath, content) {
  const p = path.join(vaultPath(), relPath);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const existing = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  const sep = existing && !existing.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(p, existing + sep + content, "utf8");
  return path.relative(vaultPath(), p);
}

export function vaultExists() {
  try {
    return fs.existsSync(vaultPath());
  } catch {
    return false;
  }
}

// ---------- daily note template rendering ----------

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

function renderTemplate(tpl, dateStr) {
  const d = parseYmd(dateStr);
  const prev = ymd(addDays(d, -1));
  const next = ymd(addDays(d, 1));
  const week = String(isoWeek(d)).padStart(2, "0");
  return tpl
    .replace(/\{\{date-1d:YYYY-MM-DD\}\}/g, prev)
    .replace(/\{\{date\+1d:YYYY-MM-DD\}\}/g, next)
    .replace(/\{\{date:YYYY-MM-DD\}\}/g, dateStr)
    .replace(/\{\{date:dddd\}\}/g, DAYS[d.getDay()])
    .replace(/\{\{date:WW\}\}/g, week)
    .replace(/\{\{date:MMMM D, YYYY\}\}/g, `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
}

/** Path to a daily note for a date (defaults to today). */
export function dailyNotePath(dateStr = ymd()) {
  return vpath(DAILY_DIR, `${dateStr}.md`);
}

/** Create today's daily note from the template if it doesn't exist. Returns { path, created }. */
export function ensureDailyNote(dateStr = ymd()) {
  const p = dailyNotePath(dateStr);
  if (fs.existsSync(p)) return { path: p, created: false };

  fs.mkdirSync(path.dirname(p), { recursive: true });
  let content;
  const tplPath = vpath(TEMPLATE);
  if (fs.existsSync(tplPath)) {
    content = renderTemplate(fs.readFileSync(tplPath, "utf8"), dateStr);
  } else {
    content = `# ${dateStr}\n\n## ✅ Tasks\n\n`;
  }
  fs.writeFileSync(p, content, "utf8");
  return { path: p, created: true };
}

export function readDailyNote(dateStr = ymd()) {
  const p = dailyNotePath(dateStr);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}

// ---------- section-aware appending ----------

/**
 * Append `lines` (string) under the `## heading` section of a markdown file.
 * Inserts at the end of that section (before the next "## " heading or EOF).
 * Creates the section at the end of the file if it doesn't exist.
 */
function appendUnderHeading(filePath, heading, lines) {
  let text = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const headingLine = `## ${heading}`;
  const idx = text.indexOf(headingLine);

  if (idx === -1) {
    const sep = text.length && !text.endsWith("\n") ? "\n" : "";
    text += `${sep}\n${headingLine}\n\n${lines}\n`;
    fs.writeFileSync(filePath, text, "utf8");
    return;
  }

  // Find the start of the next "## " heading after this one.
  const after = idx + headingLine.length;
  const rest = text.slice(after);
  const nextMatch = rest.search(/\n## /);
  const insertPos = nextMatch === -1 ? text.length : after + nextMatch;

  let before = text.slice(0, insertPos).replace(/\s+$/, "");
  const tail = text.slice(insertPos);
  const newText = `${before}\n${lines}\n${tail.startsWith("\n") ? "" : "\n"}${tail}`;
  fs.writeFileSync(filePath, newText, "utf8");
}

/** Log a checked-off task to today's note under "## Completed Tasks". */
export function logCompletedTask(title, dateStr = ymd()) {
  ensureDailyNote(dateStr);
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  appendUnderHeading(dailyNotePath(dateStr), "Completed Tasks", `- [x] ${time} - ${title}`);
}

/** Append a line under an arbitrary heading in today's daily note. */
export function appendDailyNoteLine(heading, line, dateStr = ymd()) {
  ensureDailyNote(dateStr);
  appendUnderHeading(dailyNotePath(dateStr), heading, line);
}

/** Write the end-of-day summary block under "## Daily Summary". */
export function writeDailySummary(completedTitles, dateStr = ymd()) {
  ensureDailyNote(dateStr);
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const body =
    completedTitles.length === 0
      ? `*(${stamp})* No tasks were checked off today.`
      : `*Logged ${stamp}*\n` + completedTitles.map((t) => `- ${t}`).join("\n");
  appendUnderHeading(dailyNotePath(dateStr), "Daily Summary", body);
}

// ---------- personal documents ----------

const PERSONAL_DOCS = "30 - Resources/Personal Docs";

export function listPersonalDocs() {
  const dir = vpath(PERSONAL_DOCS);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .map((f) => {
      const st = fs.statSync(path.join(dir, f));
      return { name: f, size: st.size, added: st.mtime.toISOString() };
    })
    .sort((a, b) => b.added.localeCompare(a.added));
}

export function personalDocPath(name) {
  return path.join(vpath(PERSONAL_DOCS), path.basename(name));
}

export function savePersonalDoc(name, buffer) {
  const dir = vpath(PERSONAL_DOCS);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(personalDocPath(name), buffer);
}

export function deletePersonalDoc(name) {
  const p = personalDocPath(name);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// ---------- meeting notes ----------

const MEETINGS_DIR = "20 - Areas/Meetings";
const MEETING_TEMPLATE = "50 - Templates/Meeting Note.md";

/** Create a pre-structured meeting note from the template. Returns { relPath }. */
export function createMeetingNote({ title, re, attendees }) {
  const dateStr = ymd();
  const d = parseYmd(dateStr);
  const long = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const att = Array.isArray(attendees) ? attendees.filter(Boolean) : [];

  let body;
  const tplPath = vpath(MEETING_TEMPLATE);
  if (fs.existsSync(tplPath)) {
    body = fs
      .readFileSync(tplPath, "utf8")
      .replace(/\{\{date:YYYY-MM-DD\}\}/g, dateStr)
      .replace(/\{\{date:MMMM D, YYYY\}\}/g, long)
      .replace(/^attendees: \[\]$/m, `attendees: [${att.join(", ")}]`)
      .replace(/^\*\*With:\*\* $/m, `**With:** ${att.join(", ")}`)
      .replace(/^\*\*Re:\*\* $/m, `**Re:** ${re || title || ""}`);
  } else {
    body = `# Meeting - ${long}\n\n**With:** ${att.join(", ")}\n**Re:** ${re || title || ""}\n\n## Notes\n\n## Action Items\n- [ ] \n`;
  }

  const safe = (title || re || "meeting").replace(/[^a-z0-9\- ]/gi, "").trim().replace(/\s+/g, "-") || "meeting";
  const fname = `${dateStr}-${safe}.md`;
  const p = vpath(MEETINGS_DIR, fname);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body, "utf8");
  return { relPath: path.relative(vaultPath(), p), fileName: fname };
}

// ---------- meeting recordings ----------

// Whitelisted feature -> vault folder for committed audio recordings.
const RECORDING_DIRS = {
  internship: "20 - Areas/Internship/Recordings",
  boeing: "20 - Areas/Boeing Mentorship/Recordings",
};

/** Save an audio recording (Buffer) into the given feature's vault folder. */
export function saveRecording(feature, name, buffer) {
  const rel = RECORDING_DIRS[feature];
  if (!rel) throw new Error("unknown recording feature");
  const dir = vpath(rel);
  fs.mkdirSync(dir, { recursive: true });
  const safe = path.basename(name);
  const p = path.join(dir, safe);
  fs.writeFileSync(p, buffer);
  return path.relative(vaultPath(), p);
}

// ---------- Security+ study tracker ----------

const SECPLUS_TRACKER = "10 - Projects/10.5 - Security+ Exam/Security+ Study Tracker.md";

/** Append a row to the "## Study Sessions Log" table in the Security+ tracker. */
export function logStudySession({ date, duration, topics }) {
  const p = vpath(SECPLUS_TRACKER);
  if (!fs.existsSync(p)) return false;
  const lines = fs.readFileSync(p, "utf8").split("\n");
  const hi = lines.findIndex((l) => l.startsWith("## Study Sessions Log"));
  if (hi === -1) return false;
  let i = hi + 1;
  while (i < lines.length && !lines[i].startsWith("|")) i++; // first table row (header)
  let last = i;
  while (last < lines.length && lines[last].startsWith("|")) last++; // past last row
  if (last === i) return false; // no table found
  lines.splice(last, 0, `| ${date} | ${duration} | ${topics} |`);
  fs.writeFileSync(p, lines.join("\n"), "utf8");
  return true;
}

// ---------- inbox ----------

export function appendToInbox(item) {
  const p = vpath(INBOX);
  let text = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "---\ntags: [inbox]\n---\n\n# Inbox\n";
  const stamp = ymd();
  const sep = text.endsWith("\n") ? "" : "\n";
  text += `${sep}- ${item}  *(added ${stamp})*\n`;
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, "utf8");
}

export function readInbox() {
  const p = vpath(INBOX);
  if (!fs.existsSync(p)) return [];
  const text = fs.readFileSync(p, "utf8");
  // Capture bullet list items below the intro blockquote.
  return text
    .split("\n")
    .map((l) => l.match(/^- (.+)$/))
    .filter(Boolean)
    .map((m) => m[1].replace(/\s*\*\(added \d{4}-\d{2}-\d{2}\)\*\s*$/, "").trim())
    .filter((s) => s && !s.startsWith(">"));
}

// ---------- projects ----------

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split("\n")) {
    const mm = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (mm) fm[mm[1]] = mm[2].replace(/^["']|["']$/g, "").trim();
  }
  return fm;
}

function firstNextAction(text) {
  const idx = text.indexOf("## Next Actions");
  if (idx === -1) return null;
  const rest = text.slice(idx);
  const m = rest.match(/\n- \[ \] (.+)/);
  return m ? m[1].trim() : null;
}

function titleOf(text, fallback) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

/** Read each active project's status + next action for the dashboard. */
export function readProjects() {
  const dir = vpath(PROJECTS_DIR);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folder = entry.name;
    // De-prefix "10.5 - Security+ Exam" -> "Security+ Exam.md"
    const deprefixed = folder.replace(/^\d+(\.\d+)?\s*-\s*/, "");
    const candidates = [
      path.join(dir, folder, `${deprefixed}.md`),
      ...fs.readdirSync(path.join(dir, folder)).filter((f) => f.endsWith(".md")).map((f) => path.join(dir, folder, f)),
    ];
    const file = candidates.find((c) => fs.existsSync(c));
    if (!file) continue;
    const text = fs.readFileSync(file, "utf8");
    const fm = parseFrontmatter(text);
    out.push({
      folder,
      title: titleOf(text, deprefixed),
      status: fm.status || "",
      target: fm.target || "",
      nextAction: firstNextAction(text),
      relPath: path.relative(vaultPath(), file),
    });
  }
  return out;
}

// ---------- class resources ----------

// Class display names can contain characters illegal in folder names
// (e.g. the "/" in "Systems Programming (C/C++)"). Sanitize to a safe folder.
function safeDirName(name) {
  return name.replace(/[/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

export function classDir(className) {
  return vpath(RESOURCES_DIR, safeDirName(className));
}

export function ensureClassDirs(className) {
  const base = classDir(className);
  for (const sub of ["files", "transcripts"]) {
    fs.mkdirSync(path.join(base, sub), { recursive: true });
  }
  return base;
}

export function listClassFiles(className) {
  const dir = path.join(classDir(className), "files");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .map((f) => {
      const st = fs.statSync(path.join(dir, f));
      return { name: f, size: st.size, added: st.mtime.toISOString() };
    })
    .sort((a, b) => b.added.localeCompare(a.added));
}

export function classFilePath(className, fileName) {
  // Guard against path traversal in the file name.
  const safe = path.basename(fileName);
  return path.join(classDir(className), "files", safe);
}

export function saveClassFile(className, fileName, buffer) {
  ensureClassDirs(className);
  const p = classFilePath(className, fileName);
  fs.writeFileSync(p, buffer);
  return p;
}

export function readClassNotes(className) {
  const p = path.join(classDir(className), "notes.md");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

export function writeClassNotes(className, content) {
  ensureClassDirs(className);
  fs.writeFileSync(path.join(classDir(className), "notes.md"), content ?? "", "utf8");
}

export function saveTranscript(className, title, text) {
  ensureClassDirs(className);
  const safeTitle = (title || "untitled").replace(/[^a-z0-9\- ]/gi, "").trim().replace(/\s+/g, "-") || "untitled";
  const fname = `${ymd()}-${safeTitle}.md`;
  const p = path.join(classDir(className), "transcripts", fname);
  const md = `---\nclass: ${className}\ndate: ${ymd()}\ntitle: ${title || safeTitle}\ntags: [transcript]\n---\n\n# ${title || safeTitle}\n\n${text}\n`;
  fs.writeFileSync(p, md, "utf8");
  return { path: p, fileName: fname };
}

export function listTranscripts(className) {
  const dir = path.join(classDir(className), "transcripts");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const full = path.join(dir, f);
      const text = fs.readFileSync(full, "utf8");
      const body = text.replace(/^---[\s\S]*?---\n/, "").trim().replace(/^#.*\n?/, "").trim();
      return { fileName: f, text: body, added: fs.statSync(full).mtime.toISOString() };
    })
    .sort((a, b) => b.added.localeCompare(a.added));
}

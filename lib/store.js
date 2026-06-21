import fs from "node:fs";
import path from "node:path";
import { vaultPath } from "./settings.js";

// Generic JSON collections stored INSIDE the Obsidian vault, under
// "90 - App Data/". This makes the vault the single source of truth: data
// persists across app restarts and syncs across Mac/PC through OneDrive — and
// it's literally "in the brain". Human-readable markdown mirrors are written
// separately by features that want them.
const APP_DATA = "90 - App Data";

function storePath(name) {
  return path.join(vaultPath(), APP_DATA, `${name}.json`);
}

export function readStore(name, fallback = []) {
  const p = storePath(name);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

export function writeStore(name, data) {
  const p = storePath(name);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---- collection helpers (array of {id, ...}) ----
export function listItems(name) {
  return readStore(name, []);
}

export function addItem(name, item) {
  const arr = readStore(name, []);
  const row = { id: item.id || genId(), createdAt: new Date().toISOString(), ...item };
  arr.push(row);
  writeStore(name, arr);
  return row;
}

export function updateItem(name, id, patch) {
  const arr = readStore(name, []);
  const i = arr.findIndex((x) => x.id === id);
  if (i < 0) return null;
  arr[i] = { ...arr[i], ...patch };
  writeStore(name, arr);
  return arr[i];
}

export function deleteItem(name, id) {
  writeStore(name, readStore(name, []).filter((x) => x.id !== id));
}

export function replaceAll(name, arr) {
  writeStore(name, arr);
}

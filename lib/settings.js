import { getSetting, setSetting, getAllSettings } from "./db.js";

const DEFAULT_VAULT = "C:\\Users\\mason\\OneDrive\\Desktop\\Mason-Second-Brain";

// Settings are stored in SQLite (live, no restart needed). On first read we
// seed any missing keys from environment variables so .env.local still works.
let _seeded = false;
function seed() {
  if (_seeded) return;
  const map = {
    vault_path: process.env.VAULT_PATH || DEFAULT_VAULT,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v != null && getSetting(k) == null) setSetting(k, v);
  }
  if (getSetting("vault_path") == null) setSetting("vault_path", DEFAULT_VAULT);
  _seeded = true;
}

export function settings() {
  seed();
  return getAllSettings();
}

export function get(key, fallback = null) {
  seed();
  return getSetting(key, fallback);
}

export function set(key, value) {
  seed();
  setSetting(key, value);
}

export function vaultPath() {
  return get("vault_path", DEFAULT_VAULT);
}

// First-launch is "complete" once the user confirms their vault path.
export function isConfigured() {
  return get("setup_done") === "1";
}

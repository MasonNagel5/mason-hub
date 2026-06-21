import { get, set } from "./settings.js";
import { ymd, daysBetween } from "./dates.js";

// 7-day rotation: Push, Pull, Legs, Push, Pull, Legs, Rest.
const CYCLE = ["Push", "Pull", "Legs", "Push", "Pull", "Legs", "Rest"];

// First occurrence of each label, used when the user picks "today's day".
const FIRST_INDEX = { Push: 0, Pull: 1, Legs: 2, Rest: 6 };

/**
 * Anchor the rotation: `date` (YYYY-MM-DD) is the day on which the workout was
 * `label` (Push | Pull | Legs | Rest). Stored once at first launch.
 */
export function setAnchor(date, label) {
  const idx = FIRST_INDEX[label] ?? 0;
  set("ppl_anchor_date", date);
  set("ppl_anchor_index", String(idx));
}

export function hasAnchor() {
  return !!get("ppl_anchor_date");
}

/** PPL label for a given YYYY-MM-DD (defaults to today). */
export function pplFor(dateStr = ymd()) {
  const anchorDate = get("ppl_anchor_date");
  if (!anchorDate) return null;
  const anchorIdx = parseInt(get("ppl_anchor_index", "0"), 10) || 0;
  const delta = daysBetween(anchorDate, dateStr);
  const idx = (((anchorIdx + delta) % 7) + 7) % 7;
  return CYCLE[idx];
}

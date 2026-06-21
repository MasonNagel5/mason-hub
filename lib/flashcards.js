import { getDb } from "./db.js";
import { ymd, addDays } from "./dates.js";
import { CARDS, cardsByDomain, DOMAINS } from "./secplus-deck.js";

// Grades map to SM-2 quality scores.
const Q = { again: 0, hard: 3, good: 4, easy: 5 };

function progressMap() {
  const rows = getDb().prepare("SELECT * FROM flashcard_progress").all();
  const m = {};
  for (const r of rows) m[r.card_id] = r;
  return m;
}

/**
 * Build a review queue. Cards that are due (or never seen) only, ordered
 * weak-first: previously-seen weak cards (high lapses / low ease) first, then
 * new cards.
 */
export function getQueue({ domain, limit = 20 } = {}) {
  const today = ymd();
  const pool = domain ? cardsByDomain(domain) : CARDS;
  const pm = progressMap();

  const dueOrNew = pool
    .map((card) => ({ card, p: pm[card.id] || null }))
    .filter(({ p }) => !p || !p.due || p.due <= today);

  dueOrNew.sort((a, b) => {
    const aNew = !a.p;
    const bNew = !b.p;
    if (aNew !== bNew) return aNew ? 1 : -1; // seen (weak) cards before new
    if (!aNew) {
      if (b.p.lapses !== a.p.lapses) return b.p.lapses - a.p.lapses; // more lapses first
      return a.p.ease - b.p.ease; // lower ease (weaker) first
    }
    return 0;
  });

  return dueOrNew.slice(0, limit).map(({ card, p }) => ({ ...card, progress: p }));
}

/** Apply an SM-2 review and persist. Returns the new progress row. */
export function review(cardId, grade) {
  const q = Q[grade] ?? 4;
  const db = getDb();
  const prev = db.prepare("SELECT * FROM flashcard_progress WHERE card_id = ?").get(cardId) || {
    ease: 2.5,
    interval_days: 0,
    reps: 0,
    lapses: 0,
  };

  let { ease, interval_days, reps, lapses } = prev;

  if (q < 3) {
    reps = 0;
    lapses += 1;
    interval_days = 0; // relearn — due again today
  } else {
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    if (reps === 0) interval_days = grade === "hard" ? 1 : 1;
    else if (reps === 1) interval_days = grade === "hard" ? 3 : 6;
    else interval_days = Math.round((interval_days || 1) * (grade === "hard" ? 1.2 : ease));
    if (grade === "easy") interval_days = Math.round(interval_days * 1.3);
    reps += 1;
  }

  const due = ymd(addDays(new Date(), Math.max(0, Math.round(interval_days))));
  const last = ymd();
  db.prepare(
    `INSERT INTO flashcard_progress (card_id, ease, interval_days, reps, lapses, due, last_reviewed)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(card_id) DO UPDATE SET
       ease = excluded.ease, interval_days = excluded.interval_days, reps = excluded.reps,
       lapses = excluded.lapses, due = excluded.due, last_reviewed = excluded.last_reviewed`
  ).run(cardId, ease, interval_days, reps, lapses, due, last);

  return db.prepare("SELECT * FROM flashcard_progress WHERE card_id = ?").get(cardId);
}

/** Per-domain and overall study stats for the Security+ dashboard. */
export function stats() {
  const today = ymd();
  const pm = progressMap();

  const domains = DOMAINS.map((d) => {
    const cards = cardsByDomain(d.id);
    let reviewed = 0;
    let due = 0;
    let mature = 0;
    let easeSum = 0;
    for (const c of cards) {
      const p = pm[c.id];
      if (!p) {
        due += 1; // new cards are "due" to learn
        continue;
      }
      reviewed += 1;
      easeSum += p.ease;
      if (!p.due || p.due <= today) due += 1;
      if (p.reps >= 3 && p.interval_days >= 21) mature += 1;
    }
    return {
      id: d.id,
      name: d.name,
      weight: d.weight,
      total: cards.length,
      reviewed,
      due,
      mature,
      avgEase: reviewed ? +(easeSum / reviewed).toFixed(2) : null,
    };
  });

  const totalDue = domains.reduce((s, d) => s + d.due, 0);
  const reviewedDomains = domains.filter((d) => d.reviewed >= 3);
  const weakest = reviewedDomains.length
    ? reviewedDomains.reduce((a, b) => (a.avgEase <= b.avgEase ? a : b))
    : null;

  return { domains, totalDue, weakest };
}

/** Day-of-year rotation through the five domains — "today's domain to cover". */
export function todaysDomain() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((new Date() - start) / 86400000);
  return DOMAINS[dayOfYear % DOMAINS.length];
}

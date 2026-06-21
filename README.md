# Mason · Hub

A local daily operating system — academics, career, schedule, tasks, and habits —
that reads from and writes to the Obsidian second brain vault at
`C:\Users\mason\OneDrive\Desktop\Mason-Second-Brain`.

Local-only. Nothing is deployed; run it with `npm run dev` and open it in a browser.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. On first launch a setup dialog asks for:

1. **Today's PPL gym day** — Push / Pull / Legs / Rest. This anchors the rotation.
2. **Vault path** — pre-filled; confirm it's correct.

No API keys needed.

Settings are stored in a local SQLite DB (`data/app.db`) and take effect
immediately. You can re-open the dialog any time from the sidebar gear. A
`.env.local` (see `.env.local.example`) is also honored — env values seed the DB
on first run.

## Tabs

- **Dashboard** — clock/date, an **auto-generated morning briefing** (Security+
  countdown + today's domain, PPL day, what's due in 72h, who's overdue for
  outreach, RA on-call status), a **Today / This Week toggle** (week shows the
  next 7 days of assignments, exams, shifts, and events grouped by day), the
  aggregated task list (assignments due within 7 days + vault inbox + project
  next actions + recurring gym/Security+ + manual), an inbox dump field, the
  professional-development panel, a one-click **meeting-note** generator, and
  active-project statuses. Checking off a task logs to `## Completed Tasks`; the
  **End-of-day summary** writes a `## Daily Summary` block.
- **Security+** — native spaced-repetition flashcards (SM-2), a seeded SY0-701
  deck across all five domains, weak-cards-first, keyboard-driven (Space to flip,
  1–4 to grade). Exam countdown, per-domain mastery bars, and each session
  auto-logs to the vault Security+ Study Tracker. No Anki, no manual logging.
- **Career** — government/job **application tracker**, an SFS/**clearance-track
  checklist** (seeded with financial, foreign-contact, social-media, conduct, and
  employment items), a **resume bullet builder** (XYZ format with a "not ready
  until real & defensible" flag), and a **semester GPA projector** (seeded with
  the Fall 2026 courses).
- **Calendar** — week (default) / month views. Three color-coded sources:
  class assignments (blue), RA work shifts (orange), manual events (green). Add
  recurring or one-off shifts and manual events; click any item for details.
- **Pomodoro** (sidebar) — pick a subject, run a 25/50/15 timer; on finish the
  focus session auto-logs to the vault (and the Security+ tracker for Security+
  work). Shows minutes focused today.
- **Gym** — log workouts (exercise + any number of weight×reps sets per session)
  and bodyweight. Per-exercise progress graph with three metrics (estimated 1RM
  via Epley, top set weight, total volume) plus a bodyweight-over-time graph.
  Charts are dependency-free SVG. Shows today's PPL day for context. All gym data
  lives in SQLite (`workout_sets`, `body_weight`).
- **Five class tabs** (Fall 2026) — each with:
  - **Materials** — drag-and-drop upload → `30 - Resources/<Class>/files/`.
  - **Transcription** — free in-browser live speech-to-text (Web Speech API, no
    API key; Chrome/Edge). Speak, edit, save → `30 - Resources/<Class>/transcripts/
    YYYY-MM-DD-<title>.md`, searchable in-app.
  - **Notes** — markdown editor, auto-saves to `30 - Resources/<Class>/notes.md`
    (pre-seeded from the vault's Fall 2026 Classes note).
  - **Assignments** — added manually (name, due date/time, status, points, type);
    surface on the Dashboard (due within 7 days) and the Calendar.
  - **Exams** — dedicated section with day-countdowns; exams flow into the
    dashboard week view and the morning briefing.
  - **Resources** — links/textbooks/tools to study from (with a "load suggested"
    seed for some courses).
  - **Key Contacts** — professor, office hours, email, TA, etc.

Outreach: the professional-development panel includes an **outreach composer** —
pick a contact, it drafts a templated email (your background pre-filled), you add
one specific detail, then copy / open-in-email and mark them contacted.

## Vault sync

- **Daily notes** are created from `50 - Templates/Daily Note.md` (template tokens
  rendered) when missing, in `60 - Daily Notes/YYYY-MM-DD.md`.
- **Task completion** appends under `## Completed Tasks`.
- **End-of-day summary** appends a `## Daily Summary` block (the template's own
  `## 🌙 End of Day` section is left untouched for manual journaling).
- **Inbox** items added in-app append to `00 - Inbox/Inbox.md`.
- **Projects** in `10 - Projects/*/` are read for status + first next action.

## Professional development

Tracks government-cybersecurity contacts (stored in SQLite). Shows a rotating
daily "reach out to …" prompt, logs last-contact dates, and flags anyone with
30+ days of no contact. The panel can bulk-import the contact roster parsed out
of the `2026-06-20` daily note (LinkedIn blitz list).

## Recurring tasks

- **Gym** — 6-day PPL split (Push/Pull/Legs ×2, then Rest), rotated from the
  anchor set at first launch.
- **Security+ study** — daily until the target exam date (2026-07-20).

## Data location & OneDrive note

The app's SQLite database lives **outside** the project tree, at
`%LOCALAPPDATA%\MasonProductivity\app.db` (override with the `MASON_DATA_DIR` env
var). This is deliberate: the project sits under the OneDrive-synced Desktop
folder, and OneDrive sync corrupts SQLite WAL files and resurrects deleted ones.
Your *vault* writes still go to the OneDrive vault as intended — only the app's
internal DB is relocated.

**Known OneDrive friction:** `next dev` occasionally crashes at startup with
`EINVAL: readlink ...\.next\...`. OneDrive's file placeholders break the cache
reads Next.js does. Fix: delete the `.next` folder and start again. The durable
fix is to move the whole project off the synced path (e.g. `C:\Dev\MasonProductivity`).

## Stack

Next.js (App Router) · Tailwind v4 · better-sqlite3 · Web Speech API (free,
in-browser transcription) · Node fs for direct vault read/write.

## Environment variables

| Var | Purpose |
|---|---|
| `VAULT_PATH` | Obsidian vault location |

No API keys required.

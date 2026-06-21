# Mason · Hub

A local, private daily operating system - academics, career, study, work, and life -
that lives on top of the Obsidian **second brain vault**. Everything you do is saved
into the vault, so your data is durable, syncs across your Mac and PC (via OneDrive),
and is always "in the brain."

No accounts. No cloud services. No API keys. Runs entirely on your machine.

## Run it

**Easiest:** double-click the **Mason Hub** icon on your desktop (Windows). It starts
the app and opens your browser automatically.

**Manually:**

```bash
npm install
npm run dev
```

Then open http://localhost:3000. On first launch you confirm your name and the vault
path - that's it.

- Windows launcher: `scripts/start-windows.bat`
- macOS launcher: `scripts/start-mac.command` (first time: `chmod +x scripts/start-mac.command`)

## Where your data lives (persistence + cross-device)

- **Your data is the vault.** Structured data (tasks, jobs, networking, journal,
  budget, weight, study sessions, flashcard progress, coursework) is stored as JSON in
  `90 - App Data/` inside the vault. Notes, journal entries, meeting notes, transcripts,
  and documents are saved as markdown/files in their natural PARA locations.
- Because the vault is in **OneDrive**, opening the app on another machine (Mac or PC)
  and pointing it at the same vault gives you all your data. Nothing resets between
  sessions.
- The only machine-local state is the vault *path* itself (different on Mac vs PC),
  kept in a tiny SQLite file at `%LOCALAPPDATA%\MasonProductivity\` (Win) /
  `~/Library/... ` (override with `MASON_DATA_DIR`). This is intentional - it must
  differ per machine.

## Tabs

**Daily**
- **To-Do** - morning briefing (Security+ countdown + today's domain, what's due in
  72h, who to reach out to, RA on-call), Today/This-Week task views, one-click meeting
  notes, end-of-day summary. Tasks and completions save to the vault.
- **Study** - categorized focus timer (Class / Certs / General Cyber / Projects),
  study-hours line graph, per-category totals, and native **Security+ flashcards**
  (SM-2 spaced repetition, weak-cards-first, keyboard-driven). Sessions auto-log to the
  vault and the Security+ tracker.
- **Calendar** - full month view (toggle to week). Color-coded: assignments (blue),
  RA shifts (orange), manual events (green).
- **Journal** - timestamped free-writing; each entry mirrors into that day's note.

**Academics**
- **5 class tabs** - Notes (autosave), Assignments, Exams (countdowns), Resources,
  Materials (file upload), live Transcription (free, in-browser), Key Contacts.
- **Projects** - live view of `10 - Projects/` with status + next action.

**Career**
- **Job Tracker** - editable, sortable spreadsheet in priority order. Import a markdown
  table (Cowork can generate your researched target list) or add rows by hand.
- **Networking** - outreach tracker; import your LinkedIn roster from the 6/20 note.
- **SFS** - clearance-track checklist (seeded) + OPM/obligation notes.
- **Boeing Mentorship** - meeting notes + questions/action items.
- **Documents** - resume, transcript, certs (stored in `30 - Resources/Personal Docs`).

**Work**
- **RA** - bulletin board / door decoration / programming idea boards + duty log.
- **Ambassador** - events, talking points, follow-ups + notes.

**Life**
- **Budget** - income/expense with a live monthly summary and category breakdown.
- **Weight** - bodyweight logging and trend graph.

## Tech

Next.js (App Router) · Tailwind v4 · vault-backed JSON store · Node `fs` for direct
vault read/write · Web Speech API (free transcription). `better-sqlite3` holds only the
machine-local vault path.

## Notes

- The project sits inside OneDrive; if `npm run dev` ever crashes at startup with an
  `EINVAL: readlink ...\.next\...` error, delete the `.next` folder and start again.
  The launchers do this automatically.

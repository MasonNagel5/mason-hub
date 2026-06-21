# Changelog

## Rebuild — vault-backed, multi-tab

- **Architecture:** all user data now lives in the Obsidian vault. Structured data
  is JSON under `90 - App Data/`; notes/journal/transcripts/docs are markdown & files
  in PARA locations. Syncs across Mac/PC via OneDrive. Machine-local SQLite holds only
  the per-machine vault path + calendar shifts/events.
- **Removed:** gym section, PPL rotation, Canvas API, paid Whisper/OpenAI, AI chat.
- **Tabs:** To-Do, Study (timer + hours graph + Security+ flashcards), Calendar (full
  month), Journal, 5 Classes, Projects, Job Tracker (markdown import), Networking,
  SFS, Boeing Mentorship, Documents, RA, Ambassador, Budget, Weight.
- **Everything you do saves to the vault** — tasks, completions, class notes,
  journal entries, study sessions, trackers.
- **Desktop:** one-click launchers (Windows `.bat`, macOS `.command`) + desktop
  shortcut; free in-browser transcription; zero API keys.

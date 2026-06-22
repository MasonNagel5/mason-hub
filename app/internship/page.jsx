"use client";

import AudioNotes from "../components/AudioNotes";

export default function InternshipPage() {
  return (
    <div style={{ maxWidth: 820 }}>
      <h2 className="page-title">💼 Internship</h2>
      <p className="page-sub">Record computer audio from your meetings, then commit a recording to your notes. Notes and recordings save into your vault (second brain).</p>
      <AudioNotes feature="internship" collection="internship_notes" mirrorLabel="20 - Areas/Internship/Internship Notes.md" />
    </div>
  );
}

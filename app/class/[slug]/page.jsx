"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { classBySlug } from "@/lib/classes.js";
import Materials from "../../components/class/Materials";
import Transcription from "../../components/class/Transcription";
import Notes from "../../components/class/Notes";
import Assignments from "../../components/class/Assignments";
import Exams from "../../components/class/Exams";
import Resources from "../../components/class/Resources";
import Contacts from "../../components/class/Contacts";

const SECTIONS = [
  { key: "notes", label: "📝 Notes" },
  { key: "assignments", label: "📋 Assignments" },
  { key: "exams", label: "📝 Exams" },
  { key: "resources", label: "📚 Resources" },
  { key: "materials", label: "📎 Materials" },
  { key: "transcripts", label: "🎙 Transcription" },
  { key: "contacts", label: "👤 Contacts" },
];

export default function ClassPage() {
  const { slug } = useParams();
  const cls = classBySlug(slug);
  const [section, setSection] = useState("notes");

  if (!cls) return <div style={{ color: "var(--color-red)" }}>Unknown class.</div>;

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 22 }}>{cls.name}</h2>
      <div style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 16 }}>Fall 2026</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {SECTIONS.map((s) => (
          <button key={s.key} className={section === s.key ? "btn btn-accent" : "btn"} onClick={() => setSection(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {section === "notes" && <Notes slug={slug} />}
      {section === "assignments" && <Assignments slug={slug} />}
      {section === "exams" && <Exams slug={slug} />}
      {section === "resources" && <Resources slug={slug} />}
      {section === "materials" && <Materials slug={slug} />}
      {section === "transcripts" && <Transcription slug={slug} />}
      {section === "contacts" && <Contacts slug={slug} />}
    </div>
  );
}

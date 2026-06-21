"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/client";

export default function Transcription({ slug }) {
  const [transcripts, setTranscripts] = useState([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [text, setText] = useState(""); // committed (final) transcript, editable
  const [interim, setInterim] = useState(""); // live, not-yet-final words
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const recRef = useRef(null);
  const recordingRef = useRef(false);

  async function load() {
    try {
      setTranscripts((await api(`/api/classes/${slug}/transcripts`)).transcripts);
    } catch {}
  }
  useEffect(() => {
    load();
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSupported(!!SR);
    return () => {
      recordingRef.current = false;
      try {
        recRef.current?.stop();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function start() {
    setMsg(null);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let fin = "";
      let intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript;
        else intr += r[0].transcript;
      }
      if (fin) setText((t) => (t ? `${t} ${fin.trim()}` : fin.trim()));
      setInterim(intr);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMsg("Microphone permission denied.");
        recordingRef.current = false;
        setRecording(false);
      } else if (e.error === "no-speech") {
        // ignore; onend will restart while recording
      }
    };
    rec.onend = () => {
      // The engine stops itself periodically - restart while still recording.
      if (recordingRef.current) {
        try {
          rec.start();
        } catch {}
      } else {
        setInterim("");
      }
    };

    try {
      rec.start();
      recRef.current = rec;
      recordingRef.current = true;
      setRecording(true);
    } catch {
      setMsg("Could not start the recognizer. Try again.");
    }
  }

  function stop() {
    recordingRef.current = false;
    setRecording(false);
    try {
      recRef.current?.stop();
    } catch {}
    setInterim("");
  }

  async function save() {
    const full = (text + (interim ? ` ${interim}` : "")).trim();
    if (!full) {
      setMsg("Nothing to save yet.");
      return;
    }
    setSaving(true);
    try {
      await api(`/api/classes/${slug}/transcripts`, {
        method: "POST",
        body: JSON.stringify({ title: title || "Lecture", text: full }),
      });
      setText("");
      setInterim("");
      setTitle("");
      setMsg("Saved to the vault.");
      load();
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setMsg("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function clearDraft() {
    setText("");
    setInterim("");
  }

  const filtered = transcripts.filter(
    (t) => !search || t.text.toLowerCase().includes(search.toLowerCase()) || t.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>Live transcription</h3>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--color-muted)" }}>
          Free, in-browser speech-to-text (no API key). Works best in Chrome or Edge. Speak clearly; you can edit the
          text before saving.
        </p>

        {!supported ? (
          <div style={{ fontSize: 13, color: "var(--color-yellow)" }}>
            Your browser doesn't support the Web Speech API. Use Chrome or Edge for live transcription.
          </div>
        ) : (
          <>
            <input
              className="input"
              placeholder="Transcript title (e.g. Lecture 4 - Block Ciphers)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              {!recording ? (
                <button className="btn btn-accent" onClick={start}>● Start recording</button>
              ) : (
                <button className="btn" style={{ borderColor: "var(--color-red)", color: "var(--color-red)" }} onClick={stop}>
                  ■ Stop
                </button>
              )}
              <button className="btn" onClick={save} disabled={saving || (!text && !interim)}>
                {saving ? "Saving…" : "Save transcript"}
              </button>
              <button className="btn" onClick={clearDraft} disabled={!text && !interim}>Clear</button>
              {recording && <span style={{ fontSize: 13, color: "var(--color-red)" }}>● Listening…</span>}
              {msg && <span style={{ fontSize: 12, color: msg.includes("fail") || msg.includes("denied") ? "var(--color-red)" : "var(--color-green)" }}>{msg}</span>}
            </div>

            <textarea
              className="input"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Transcript will appear here as you speak. You can edit it directly."
              style={{ resize: "vertical", lineHeight: 1.5 }}
            />
            {interim && (
              <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 6, fontStyle: "italic" }}>… {interim}</div>
            )}
          </>
        )}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Transcripts ({transcripts.length})</h3>
          <input className="input" placeholder="Search transcripts…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 240 }} />
        </div>
        {filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{transcripts.length ? "No matches." : "No transcripts yet."}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((t) => (
              <details key={t.fileName} className="card" style={{ padding: "10px 12px", background: "var(--color-bg)" }}>
                <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  {t.fileName.replace(/\.md$/, "")}
                  <span style={{ color: "var(--color-muted)", fontWeight: 400, marginLeft: 8 }}>{new Date(t.added).toLocaleDateString()}</span>
                </summary>
                <div style={{ fontSize: 13, marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.5, color: "var(--color-text)" }}>{t.text}</div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

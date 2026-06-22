"use client";

import { useEffect, useRef, useState } from "react";
import { store } from "../lib/client";

/**
 * Computer-audio recorder + vault-backed notes, reusable across feature tabs.
 * - feature: key for the recording upload route + vault folder (e.g. "internship").
 * - collection: vault-backed store collection for notes (e.g. "internship_notes").
 * - mirrorLabel: path of the Obsidian markdown mirror, shown as a hint.
 */
export default function AudioNotes({ feature, collection, mirrorLabel }) {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <>
      <AudioRecorder feature={feature} collection={collection} onCommitted={() => setReloadKey((k) => k + 1)} />
      <Notes collection={collection} mirrorLabel={mirrorLabel} reloadKey={reloadKey} />
    </>
  );
}

// ---------------- helpers ----------------
function pickMime() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}
function extFor(mime) {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "m4a";
  return "webm";
}
function stamp() {
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

// ---------------- Computer-audio recorder ----------------
function AudioRecorder({ feature, collection, onCommitted }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clips, setClips] = useState([]); // { id, url, blob, name, size, committed, busy }
  const [error, setError] = useState("");
  const mr = useRef(null);
  const chunks = useRef([]);
  const streamRef = useRef(null);
  const tick = useRef(null);

  useEffect(() => () => {
    clearInterval(tick.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("This browser can't capture system audio. Use Chrome or Edge.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const audio = s.getAudioTracks();
      if (!audio.length) {
        s.getTracks().forEach((t) => t.stop());
        setError("No audio was shared. In the picker, choose a screen/window/tab and tick “Share system audio” (Chrome calls it “Share tab audio” for a tab).");
        return;
      }
      streamRef.current = s;
      const mime = pickMime();
      const rec = new MediaRecorder(new MediaStream(audio), mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.current.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        const url = URL.createObjectURL(blob);
        setClips((c) => [{ id: stamp() + "-" + Math.random().toString(36).slice(2, 6), url, blob, name: `${feature}-audio-${stamp()}.${extFor(type)}`, size: blob.size, committed: false, busy: false }, ...c]);
      };
      audio[0].onended = () => stop();
      rec.start();
      mr.current = rec;
      setRecording(true);
      setElapsed(0);
      tick.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (e) {
      setError(e?.name === "NotAllowedError" ? "Screen-share was cancelled." : "Couldn't start recording: " + (e?.message || e));
    }
  }

  function stop() {
    clearInterval(tick.current);
    setRecording(false);
    try { if (mr.current && mr.current.state !== "inactive") mr.current.stop(); } catch {}
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }

  const patch = (id, p) => setClips((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));

  async function commit(clip) {
    patch(clip.id, { busy: true });
    try {
      const fd = new FormData();
      fd.append("file", clip.blob, clip.name);
      fd.append("name", clip.name);
      fd.append("feature", feature);
      const r = await fetch("/api/recording", { method: "POST", body: fd });
      if (!r.ok) throw new Error("upload failed");
      const { relPath, fileName } = await r.json();
      await store.add(collection, { text: "", recording: relPath, recordingName: fileName, ts: new Date().toISOString() });
      patch(clip.id, { busy: false, committed: true });
      onCommitted?.();
    } catch (e) {
      patch(clip.id, { busy: false });
      setError("Couldn't commit to notes: " + (e?.message || e));
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="card" style={{ padding: 16, marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: "0 0 2px", fontSize: 14 }}>🎙 Record computer audio</h3>
          <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
            {recording ? "Recording system audio…" : "Captures what plays through your computer (the other participants). Tell people you're recording first."}
          </div>
        </div>
        {!recording ? (
          <button className="btn btn-accent" onClick={start}>● Start recording</button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 18, color: "var(--color-red)" }}>● {mm}:{ss}</span>
            <button className="btn" onClick={stop}>■ Stop</button>
          </div>
        )}
      </div>

      {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-red)" }}>{error}</div>}

      {clips.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            This session · commit to notes to keep them in your vault
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clips.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <audio controls src={c.url} style={{ height: 34 }} />
                <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{(c.size / 1048576).toFixed(1)} MB</span>
                <a className="btn" style={{ padding: "3px 10px", fontSize: 12, textDecoration: "none" }} href={c.url} download={c.name}>⬇ Download</a>
                {c.committed ? (
                  <span style={{ fontSize: 12, color: "var(--color-green)" }}>✓ Committed to notes</span>
                ) : (
                  <button className="btn btn-accent" style={{ padding: "3px 10px", fontSize: 12 }} disabled={c.busy} onClick={() => commit(c)}>
                    {c.busy ? "Saving…" : "➕ Commit to notes"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Notes (vault-backed, mirrored to Obsidian) ----------------
function Notes({ collection, mirrorLabel, reloadKey }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() { try { setNotes(await store.list(collection)); } catch {} }
  useEffect(() => { load(); }, [reloadKey, collection]);

  async function add() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await store.add(collection, { text: text.trim(), ts: new Date().toISOString() });
      setText(""); load();
    } finally { setSaving(false); }
  }
  async function saveText(id, value) { await store.update(collection, id, { text: value }); }
  async function del(id) { const { items } = await store.remove(collection, id); setNotes(items); }

  const sorted = [...notes].sort((a, b) => new Date(b.ts || b.createdAt || 0) - new Date(a.ts || a.createdAt || 0));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Notes</h3>
        {mirrorLabel && <span style={{ fontSize: 11, color: "var(--color-muted)" }}>Mirrored to <code>{mirrorLabel}</code></span>}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 18 }}>
        <textarea className="input" rows={3} placeholder="Add a note (meeting summary, follow-ups, action items)…" value={text}
          onChange={(e) => setText(e.target.value)} style={{ resize: "vertical", lineHeight: 1.6 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button className="btn btn-accent" onClick={add} disabled={saving}>{saving ? "Saving…" : "Save note"}</button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ color: "var(--color-muted)", fontSize: 13 }}>No notes yet. Record audio and commit it, or add a note above.</div>
      ) : (
        sorted.map((n) => {
          const when = new Date(n.ts || n.createdAt || Date.now());
          return (
            <div key={n.id} className="card" style={{ padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--color-muted)", marginBottom: 8 }}>
                <span>{when.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                <button className="btn" style={{ padding: "1px 6px", fontSize: 11 }} onClick={() => del(n.id)}>✕</button>
              </div>
              {n.recordingName && (
                <div style={{ fontSize: 12, marginBottom: 8, color: "var(--color-accent)" }}>
                  🎧 {n.recordingName} <span style={{ color: "var(--color-muted)" }}>· embedded in your vault note</span>
                </div>
              )}
              <textarea className="input" rows={3} defaultValue={n.text || ""} placeholder="Add notes for this recording…"
                onBlur={(e) => saveText(n.id, e.target.value)} style={{ resize: "vertical", lineHeight: 1.6 }} />
            </div>
          );
        })
      )}
    </div>
  );
}

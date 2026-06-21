"use client";

import DocEditor from "../components/DocEditor";
import ListBoard from "../components/ListBoard";

export default function AmbassadorPage() {
  return (
    <div>
      <h2 className="page-title">🎤 Student Ambassador</h2>
      <p className="page-sub">Events, talking points, and follow-ups for your ambassador role.</p>

      <div style={{ marginBottom: 16 }}>
        <ListBoard collection="ambassador_log" categories={["Upcoming Events", "Talking Points", "Follow-ups"]} placeholder="Add…" />
      </div>

      <DocEditor docKey="ambassador" label="Ambassador Notes" placeholder={"Tour scripts, event recaps, contacts from prospective students/families…"} />
    </div>
  );
}

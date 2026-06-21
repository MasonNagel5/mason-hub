"use client";

import DocEditor from "../components/DocEditor";
import ListBoard from "../components/ListBoard";

export default function BoeingPage() {
  return (
    <div>
      <h2 className="page-title">✈ Boeing Mentorship</h2>
      <p className="page-sub">Meeting notes, action items, and questions for your Boeing mentor. Saved to your vault.</p>

      <div style={{ marginBottom: 16 }}>
        <ListBoard collection="boeing_meetings" categories={["Questions to ask", "Action items"]} checkable placeholder="Add…" />
      </div>

      <DocEditor docKey="boeing" label="Meeting Notes" placeholder={"## 2026-09-01 - Mentor sync\n- Topics:\n- Advice:\n- Next steps:"} minHeight={400} />
    </div>
  );
}

"use client";

import DocEditor from "../components/DocEditor";
import ListBoard from "../components/ListBoard";

export default function RAPage() {
  return (
    <div>
      <h2 className="page-title">🏠 Resident Advisor</h2>
      <p className="page-sub">Programming ideas, bulletin boards, door decs, and your running RA log — all saved to the vault.</p>

      <div style={{ marginBottom: 16 }}>
        <ListBoard collection="ra_ideas" categories={["Bulletin Boards", "Door Decorations", "Programming / Events"]} placeholder="New idea…" />
      </div>

      <DocEditor docKey="ra" label="RA Log & Notes" placeholder={"Duty notes, incident logs, resident check-ins, roster reminders…"} />
    </div>
  );
}

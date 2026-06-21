"use client";

import DocEditor from "../components/DocEditor";
import ListBoard from "../components/ListBoard";

// Seeded clearance-track checklist (only inserted if the collection is empty).
const CLEARANCE_SEED = [
  { text: "No unpaid/collections debt; credit in good standing", category: "Financial", done: false },
  { text: "File taxes on time every year", category: "Financial", done: false },
  { text: "Keep records for large deposits/transactions", category: "Financial", done: false },
  { text: "Track close/continuing foreign national contacts", category: "Foreign contacts", done: false },
  { text: "Log foreign travel (dates, countries, purpose)", category: "Foreign contacts", done: false },
  { text: "Audit public social media; remove anything that reads badly", category: "Conduct", done: false },
  { text: "No illegal drug use (incl. cannabis - federal Schedule I)", category: "Conduct", done: false },
  { text: "Maintain consistent employment/education history (no unexplained gaps)", category: "History", done: false },
  { text: "Keep an accurate residence history (addresses + dates)", category: "History", done: false },
  { text: "Always truthful on SF-86 - omissions are worse than facts", category: "Conduct", done: false },
  { text: "Identify references who've known you 3+ years", category: "History", done: false },
];

export default function SFSPage() {
  return (
    <div>
      <h2 className="page-title">🎓 Scholarship for Service</h2>
      <p className="page-sub">CyberCorps SFS - OPM approval, service obligation, and clearance-track habits. Saved to your vault.</p>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Clearance-track checklist</h3>
        <ListBoard collection="sfs_checklist" categories={["Financial", "Foreign contacts", "Conduct", "History"]} checkable seed={CLEARANCE_SEED} placeholder="Add item…" />
      </div>

      <DocEditor docKey="sfs" label="SFS Notes & Obligation Tracker" placeholder={"OPM status updates, service obligation details, agency placement targets, POCs, deadlines…"} />
    </div>
  );
}

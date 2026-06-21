import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: "var(--color-accent)" }}>404</div>
      <p style={{ color: "var(--color-muted)", fontSize: 14 }}>That page isn't part of the hub.</p>
      <Link href="/" className="btn btn-accent" style={{ textDecoration: "none", display: "inline-block", marginTop: 12 }}>
        Back to To-Do
      </Link>
    </div>
  );
}

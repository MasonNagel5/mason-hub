import { NextResponse } from "next/server";
import { settings, set, isConfigured } from "@/lib/settings.js";
import { vaultExists } from "@/lib/vault.js";
import { hasAnchor, pplFor, setAnchor } from "@/lib/ppl.js";
import { ymd } from "@/lib/dates.js";

// Keys we never echo back in full.
const SECRET = new Set();

export async function GET() {
  const s = settings();
  const masked = {};
  for (const [k, v] of Object.entries(s)) {
    masked[k] = SECRET.has(k) ? (v ? "set" : "") : v;
  }
  return NextResponse.json({
    settings: masked,
    configured: isConfigured(),
    vaultExists: vaultExists(),
    pplToday: hasAnchor() ? pplFor(ymd()) : null,
  });
}

export async function POST(req) {
  const body = await req.json();
  const { pplDay, ...rest } = body;

  for (const [k, v] of Object.entries(rest)) {
    // Allow only known keys.
    if (["vault_path"].includes(k)) {
      if (v !== undefined) set(k, v);
    }
  }

  if (pplDay) {
    setAnchor(ymd(), pplDay);
  }

  return NextResponse.json({ ok: true, configured: isConfigured() });
}

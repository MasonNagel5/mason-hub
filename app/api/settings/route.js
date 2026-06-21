import { NextResponse } from "next/server";
import { settings, set, isConfigured } from "@/lib/settings.js";
import { vaultExists } from "@/lib/vault.js";

export async function GET() {
  return NextResponse.json({
    settings: settings(),
    configured: isConfigured(),
    vaultExists: vaultExists(),
  });
}

export async function POST(req) {
  const body = await req.json();
  for (const [k, v] of Object.entries(body)) {
    if (["vault_path", "setup_done", "display_name"].includes(k)) {
      if (v !== undefined) set(k, v);
    }
  }
  return NextResponse.json({ ok: true, configured: isConfigured() });
}

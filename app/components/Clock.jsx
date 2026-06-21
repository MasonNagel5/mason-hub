"use client";

import { useEffect, useState } from "react";
import { fmtDateLong } from "@/lib/dates.js";

export default function Clock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <div style={{ height: 54 }} />;
  return (
    <div>
      <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
        {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
      </div>
      <div style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 2 }}>{fmtDateLong(now)}</div>
    </div>
  );
}

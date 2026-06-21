"use client";

// Dependency-free SVG line chart. Even x-spacing by index, shared x labels.
// props:
//   labels: string[]                      (x-axis labels, e.g. dates)
//   series: { name, color, values:(number|null)[] }[]
//   height?: number, unit?: string, yZero?: boolean
export default function LineChart({ labels = [], series = [], height = 260, unit = "", yZero = false }) {
  const W = 720;
  const H = height;
  const padL = 46, padR = 16, padT = 16, padB = 30;
  const n = labels.length;

  const all = series.flatMap((s) => s.values).filter((v) => v != null && Number.isFinite(v));
  if (n === 0 || all.length === 0) {
    return <div style={{ fontSize: 13, color: "var(--color-muted)", padding: "24px 0", textAlign: "center" }}>No data yet — log some entries to see the graph.</div>;
  }

  let min = Math.min(...all);
  let max = Math.max(...all);
  if (yZero) min = Math.min(0, min);
  if (min === max) { max = min + 1; min = Math.max(0, min - 1); }
  const range = max - min;
  // pad the domain a touch
  min = min - range * 0.08;
  max = max + range * 0.08;

  const x = (i) => (n === 1 ? (padL + (W - padL - padR) / 2) : padL + (i / (n - 1)) * (W - padL - padR));
  const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => min + (i / ticks) * (max - min));

  // x labels: at most ~6, evenly sampled
  const maxLabels = 6;
  const step = Math.max(1, Math.ceil(n / maxLabels));
  const xIdx = [];
  for (let i = 0; i < n; i += step) xIdx.push(i);
  if (xIdx[xIdx.length - 1] !== n - 1) xIdx.push(n - 1);

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {/* y gridlines + labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="var(--color-border)" strokeWidth="1" />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--color-muted)">
              {fmt(t)}
            </text>
          </g>
        ))}
        {/* x labels */}
        {xIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
            {shortDate(labels[i])}
          </text>
        ))}
        {/* series */}
        {series.map((s) => {
          const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean);
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
          return (
            <g key={s.name}>
              {pts.length > 1 && <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
              {s.values.map((v, i) =>
                v == null ? null : (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color}>
                    <title>{`${labels[i]} · ${s.name}: ${fmt(v)}${unit}`}</title>
                  </circle>
                )
              )}
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6 }}>
          {series.map((s) => (
            <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-muted)" }}>
              <span style={{ width: 12, height: 3, background: s.color, display: "inline-block", borderRadius: 2 }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function fmt(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
function shortDate(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return s || "";
  const [, m, d] = s.split("-");
  return `${Number(m)}/${Number(d)}`;
}

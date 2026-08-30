import { useEffect, useMemo, useRef, useState } from "react";
import { RANGES, genSeries, nextTick, percentiles } from "../lib/data";
import { usePrefersReducedMotion } from "../lib/hooks";

const W = 640;
const H = 210;
const PAD = { l: 40, r: 14, t: 14, b: 26 };

export default function LatencyPanel() {
  const [rangeId, setRangeId] = useState("live");
  const def = RANGES.find((r) => r.id === rangeId)!;
  const [series, setSeries] = useState<number[]>(() => genSeries(RANGES[0]));
  const reduced = usePrefersReducedMotion();
  const rangeRef = useRef(rangeId);
  rangeRef.current = rangeId;

  useEffect(() => {
    setSeries(genSeries(def));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeId]);

  useEffect(() => {
    if (rangeId !== "live") return;
    const id = setInterval(() => {
      setSeries((prev) => {
        const live = RANGES[0];
        if (rangeRef.current !== "live") return prev;
        return [...prev.slice(1), nextTick(live, prev[prev.length - 1])];
      });
    }, 2400);
    return () => clearInterval(id);
  }, [rangeId]);

  const { path, area, pts, yTicks, lastPt } = useMemo(() => {
    const min = Math.min(...series) * 0.92;
    const max = Math.max(...series) * 1.06;
    const x = (i: number) => PAD.l + (i / (series.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b);
    const pts = series.map((v, i) => [x(i), y(v)] as const);
    const path = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
    const area = `${path} L${x(series.length - 1).toFixed(1)},${H - PAD.b} L${PAD.l},${H - PAD.b} Z`;
    const yTicks = [0, 1, 2, 3].map((i) => {
      const v = min + ((max - min) * i) / 3;
      return { v: Math.round(v), y: y(v) };
    });
    return { path, area, pts, yTicks, lastPt: pts[pts.length - 1] };
  }, [series]);

  const stats = useMemo(() => percentiles(series), [series]);
  const xLabel = rangeId === "live" ? "−120s" : rangeId === "24h" ? "−24h" : "−7d";
  const modeLabel = def.label === "LIVE" ? "streaming" : "bucket " + def.step;

  return (
    <div className="flex h-full flex-col border border-edge bg-pit/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.25em] text-dim uppercase">
            inference latency · <span className={rangeId === "live" ? "text-ok" : "text-snow"}>{modeLabel}</span>
          </p>
          <h3 className="font-display mt-1 text-lg font-semibold tracking-wide text-snow uppercase">
            Global response time
          </h3>
        </div>
        <div className="flex border border-edge" role="tablist" aria-label="Chart range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={rangeId === r.id}
              onClick={() => setRangeId(r.id)}
              className={`px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.18em] transition-colors duration-200 ${
                rangeId === r.id ? "bg-ok/15 text-ok" : "text-fog hover:bg-cell hover:text-snow"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* chart */}
      <div className="mt-5 flex-1">
        <svg key={rangeId} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Latency chart, ${def.label} range`}>
          <defs>
            <linearGradient id="latArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ddc97" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3ddc97" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="rgba(46,70,58,0.5)" strokeDasharray="3 5" />
              <text x={PAD.l - 8} y={t.y + 3.5} textAnchor="end" fontSize="9.5" fill="#5d7468" fontFamily="IBM Plex Mono, monospace">
                {t.v}
              </text>
            </g>
          ))}

          <text x={PAD.l} y={H - 8} fontSize="9.5" fill="#5d7468" fontFamily="IBM Plex Mono, monospace">
            {xLabel}
          </text>
          <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="9.5" fill="#5d7468" fontFamily="IBM Plex Mono, monospace">
            now
          </text>
          <text x={W - PAD.r} y={PAD.t - 2} textAnchor="end" fontSize="9.5" fill="#5d7468" fontFamily="IBM Plex Mono, monospace">
            ms
          </text>

          <path d={area} fill="url(#latArea)" className={reduced ? "" : "motion-area"} />
          <path
            d={path}
            fill="none"
            stroke="#3ddc97"
            strokeWidth="2"
            strokeLinejoin="round"
            className={reduced ? "" : "motion-draw"}
            style={{ filter: "drop-shadow(0 0 6px rgba(61,220,151,0.45))", ["--dash" as never]: "1600" }}
          />

          <circle cx={lastPt[0]} cy={lastPt[1]} r="4" fill="#3ddc97" />
          {!reduced && <circle cx={lastPt[0]} cy={lastPt[1]} r="4" fill="none" stroke="#3ddc97" strokeWidth="1.5" className="chart-ping" />}
        </svg>
      </div>

      {/* percentile tiles */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {(
          [
            ["p50", stats.p50],
            ["p95", stats.p95],
            ["p99", stats.p99],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="border border-edge bg-cell/70 px-4 py-3 transition-colors duration-200 hover:border-edgehi">
            <p className="font-mono text-[10px] tracking-[0.25em] text-dim uppercase">{k} latency</p>
            <p className="font-mono mt-1 text-xl font-semibold text-snow tabular-nums sm:text-2xl">
              {v}
              <span className="ml-1 text-xs font-normal text-dim">ms</span>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 font-mono text-[11px] text-dim">
        SLO target <span className="text-fog">p95 &lt; 350ms</span> · currently{" "}
        <span className={stats.p95 < 350 ? "text-ok" : "text-warn"}>{stats.p95 < 350 ? "within budget" : "breaching"}</span> · error
        budget consumed this month <span className="text-fog">11%</span>
      </p>
    </div>
  );
}

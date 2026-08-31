import { useEffect, useRef, useState } from "react";
import { REGIONS } from "../lib/data";
import { usePrefersReducedMotion, StatusChip } from "../lib/hooks";

type Results = Record<string, number[] | undefined>;

function makePings(base: number): number[] {
  return [0, 1, 2].map(() => Math.round(base * (0.85 + Math.random() * 0.4)));
}

export default function ProbePanel() {
  const [results, setResults] = useState<Results>({});
  const [running, setRunning] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const alive = useRef(true);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, reduced ? 80 : ms));

  async function probeOne(id: string) {
    if (!alive.current) return;
    setActiveId(id);
    await sleep(480);
    if (!alive.current) return;
    const region = REGIONS.find((r) => r.id === id)!;
    setResults((prev) => ({ ...prev, [id]: makePings(region.base) }));
    setActiveId(null);
  }

  async function runAll() {
    if (running) return;
    setRunning(true);
    setResults({});
    for (const region of REGIONS) {
      if (!alive.current) return;
      setActiveId(region.id);
      await sleep(430);
      if (!alive.current) return;
      setResults((prev) => ({ ...prev, [region.id]: makePings(region.base) }));
    }
    setActiveId(null);
    setRunning(false);
  }

  const probed = REGIONS.filter((r) => results[r.id]).length;
  const slowCount = REGIONS.filter((r) => {
    const p = results[r.id];
    return p && p.reduce((a, b) => a + b, 0) / p.length > 130;
  }).length;

  return (
    <div className="flex h-full flex-col border border-edge bg-pit/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.25em] text-dim uppercase">edge reachability</p>
          <h3 className="font-display mt-1 text-lg font-semibold tracking-wide text-snow uppercase">Region probes</h3>
        </div>
        <button
          onClick={runAll}
          disabled={running}
          className={`font-display group relative overflow-hidden border px-5 py-2.5 text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-200 ${
            running
              ? "cursor-wait border-edge text-dim"
              : "border-ok/50 bg-ok/10 text-ok hover:bg-ok/20 hover:shadow-[0_0_28px_-8px_rgba(61,220,151,0.6)]"
          }`}
        >
          {running ? (
            <>
              probing {probed}/{REGIONS.length}
              <span className="motion-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-ok/10 to-transparent" />
            </>
          ) : (
            "Run probe sequence"
          )}
        </button>
      </div>

      <div className="mt-5 flex-1">
        {REGIONS.map((r) => {
          const pings = results[r.id];
          const isActive = activeId === r.id;
          const avg = pings ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : null;
          return (
            <div
              key={r.id}
              className={`relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 border-b border-edge/70 py-3.5 transition-colors duration-200 last:border-b-0 sm:grid-cols-[150px_90px_1fr_auto] ${
                isActive ? "bg-cell/70" : "hover:bg-cell/40"
              }`}
            >
              <div>
                <p className="font-display text-sm font-semibold text-snow">{r.name}</p>
                <p className="font-mono text-[10.5px] text-dim">{r.code}</p>
              </div>
              <p className="hidden font-mono text-xs text-fog tabular-nums sm:block">
                ~{r.base}
                <span className="text-dim">ms</span>
              </p>

              <div className="col-span-2 flex min-h-7 items-center gap-2 sm:col-span-1">
                {isActive && (
                  <span className="font-mono text-xs text-glow">
                    icmp<span className="motion-blink">_</span>
                  </span>
                )}
                {!isActive && !pings && <span className="font-mono text-xs text-dim">— not probed this session</span>}
                {pings?.map((p, i) => (
                  <span
                    key={i}
                    className={`motion-cell border border-edge bg-cell px-2 py-0.5 font-mono text-[11px] tabular-nums ${
                      p > 130 ? "text-warn" : "text-snow"
                    }`}
                    style={{ animationDelay: reduced ? "0ms" : `${i * 90}ms` }}
                  >
                    {p}ms
                  </span>
                ))}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                {avg !== null && <StatusChip tone={avg > 130 ? "warn" : "ok"} label={avg > 130 ? `slow ${avg}ms` : `ok ${avg}ms`} />}
                <button
                  onClick={() => probeOne(r.id)}
                  disabled={running}
                  aria-label={`Re-probe ${r.name}`}
                  className="border border-edge p-1.5 text-fog transition-all duration-200 hover:border-glow/50 hover:text-glow disabled:opacity-40"
                >
                  <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 ${isActive ? "animate-spin" : ""}`} fill="none" aria-hidden="true">
                    <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-[11px] text-dim" aria-live="polite">
        {running
          ? "sweep in progress…"
          : probed === 0
            ? "no probes yet this session — results are simulated from nominal RTTs"
            : `${probed}/${REGIONS.length} regions probed · ${slowCount === 0 ? "all within SLO" : `${slowCount} region(s) above 130ms`}`}
      </p>
    </div>
  );
}

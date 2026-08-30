import { useLiveMetrics, useUtcClock, Reveal } from "../lib/hooks";

function StatRow({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-edge/70 py-3 last:border-b-0">
      <span className="font-mono text-[11px] tracking-[0.22em] text-fog uppercase">{label}</span>
      <span className={`font-mono text-lg font-semibold tabular-nums ${accent ?? "text-snow"}`}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-dim">{unit}</span>}
      </span>
    </div>
  );
}

export default function Masthead() {
  const clock = useUtcClock();
  const m = useLiveMetrics();

  const C = 2 * Math.PI * 26;
  const offset = C * (1 - m.phase);

  return (
    <section aria-label="Overall service status" className="pt-10 pb-12 sm:pt-16">
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-end">
        {/* headline board */}
        <div>
          <Reveal>
            <p className="flex flex-wrap items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-fog uppercase">
              <span className="inline-flex items-center gap-2 border border-glow/40 bg-glow/10 px-2.5 py-1 text-glow">
                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-glow motion-blink" />
                live monitor
              </span>
              <span className="text-dim">unofficial · simulated telemetry</span>
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="font-display mt-6 text-[13vw] leading-[0.95] font-bold tracking-tight uppercase sm:text-6xl lg:text-7xl">
              <span className="flex items-center gap-4 text-snow sm:gap-5">
                <span className="dot-ring relative inline-block h-4 w-4 shrink-0 rounded-full bg-ok text-ok sm:h-5 sm:w-5" />
                All systems
              </span>
              <span className="text-transparent" style={{ WebkitTextStroke: "1.5px rgba(61,220,151,0.9)" }}>
                operational
              </span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-fog">
              No open incidents across inference, console or delivery. The last major
              event <span className="text-snow">INC-2214</span> was resolved{" "}
              <span className="text-snow">11 days ago</span> in 95 minutes. If your
              integration is failing right now, check your region below and re-run a probe.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-xs text-dim">
              <span>
                <span className="text-ok">99.94%</span> 90-day uptime
              </span>
              <span>
                <span className="text-snow">42</span> edge PoPs
              </span>
              <span>
                SLO <span className="text-snow">p95 &lt; 350ms</span>
              </span>
              <span className="hidden items-center gap-2 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" /> checked{" "}
                {Math.max(0, Math.round(m.phase * 2.4))}s ago
              </span>
            </div>
          </Reveal>
        </div>

        {/* poll console */}
        <Reveal delay={200}>
          <div className="border border-edge bg-pit/80 p-5 shadow-[0_0_60px_-30px_rgba(61,220,151,0.25)]">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(46,70,58,0.55)" strokeWidth="4" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#3ddc97"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                  />
                </svg>
                <span className="font-display absolute inset-0 flex items-center justify-center text-[10px] font-semibold tracking-widest text-ok">
                  POLL
                </span>
              </div>
              <div>
                <p className="font-mono text-[11px] tracking-[0.22em] text-dim uppercase">probe loop</p>
                <p className="font-mono text-sm text-fog">
                  every 2.4s · <span className="text-snow">{clock}</span>
                </p>
              </div>
            </div>

            <div className="mt-4">
              <StatRow label="global p95" value={String(m.p95)} unit="ms" accent="text-ok" />
              <StatRow label="error rate" value={m.errRate.toFixed(3)} unit="%" accent={m.errRate > 0.1 ? "text-warn" : "text-snow"} />
              <StatRow label="throughput" value={m.rpm.toFixed(1)} unit="k req/min" />
              <StatRow label="open incidents" value="0" accent="text-ok" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

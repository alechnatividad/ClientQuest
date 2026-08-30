import { useMemo } from "react";
import { buildWire } from "../lib/data";

const tone = {
  OK: "text-ok",
  SLOW: "text-warn",
  INFO: "text-glow",
} as const;

export default function Ticker() {
  const wire = useMemo(() => buildWire(), []);
  const items = [...wire, ...wire];

  return (
    <div className="ticker-shell relative border-y border-edge bg-pit/60" aria-label="Recent status events">
      <div className="flex items-stretch">
        <div className="font-display relative z-10 flex shrink-0 items-center gap-2 border-r border-edge bg-ink px-4 py-2.5 text-xs font-semibold tracking-[0.25em] text-snow uppercase">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ok" fill="none" aria-hidden="true">
            <path d="M2 8h3l2-4 2.5 8L11.5 8H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          status wire
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track flex w-max items-center gap-10 whitespace-nowrap px-6 py-2.5">
            {items.map((e, i) => (
              <span key={i} className="flex items-center gap-3 font-mono text-xs text-fog" aria-hidden={i >= wire.length}>
                <span className="text-dim">{e.t}</span>
                <span className="text-snow">{e.target}</span>
                <span>{e.value}</span>
                <span className={`font-semibold ${tone[e.state]}`}>{e.state}</span>
                <span className="ml-4 text-edgehi">◆</span>
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-ink to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-ink to-transparent" />
        </div>
      </div>
    </div>
  );
}

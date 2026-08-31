import { useState } from "react";
import { COMPONENTS, dayLabel, uptimePct, type DayState, type ServiceComponent } from "../lib/data";
import { Reveal } from "../lib/hooks";

const stateMeta: Record<DayState, { label: string; bar: string; text: string; pct: string }> = {
  ok: { label: "Operational", bar: "bg-ok/65", text: "text-ok", pct: "100%" },
  partial: { label: "Degraded", bar: "bg-warn", text: "text-warn", pct: "68%" },
  down: { label: "Outage", bar: "bg-crit", text: "text-crit", pct: "4%" },
};

function ComponentRow({ comp, index }: { comp: ServiceComponent; index: number }) {
  const [tip, setTip] = useState<number | null>(null);
  const pct = uptimePct(comp.days);
  const incidents = comp.days.filter((d) => d !== "ok").length;

  return (
    <Reveal
      delay={index * 70}
      className="group grid gap-4 border-b border-edge/70 py-5 transition-colors duration-300 last:border-b-0 hover:bg-cell/50 md:grid-cols-[250px_1fr_110px] md:items-center md:gap-6 md:px-3"
    >
      <div className="flex items-start justify-between gap-3 md:block">
        <div>
          <h3 className="font-display text-[15px] font-semibold tracking-wide text-snow">{comp.name}</h3>
          <p className="mt-1 font-mono text-[11px] text-dim">
            {comp.endpoint} · {comp.region}
          </p>
        </div>
      </div>

      {/* 90-day strip */}
      <div className="relative">
        {tip !== null && (
          <div
            className="pointer-events-none absolute -top-11 z-20 -translate-x-1/2 border border-edgehi bg-raise px-2.5 py-1.5 font-mono text-[11px] whitespace-nowrap text-snow shadow-lg shadow-black/40"
            style={{ left: `${Math.min(93, Math.max(7, ((tip + 0.5) / 90) * 100))}%` }}
            role="status"
          >
            <span className="text-dim">{dayLabel(89 - tip)} · </span>
            <span className={stateMeta[comp.days[tip]].text}>{stateMeta[comp.days[tip]].label}</span>
            <span className="text-dim"> · {stateMeta[comp.days[tip]].pct}</span>
          </div>
        )}
        <div className="flex h-9 items-end gap-[2px]" onMouseLeave={() => setTip(null)}>
          {comp.days.map((d, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              aria-label={`${dayLabel(89 - i)}: ${stateMeta[d].label}`}
              onMouseEnter={() => setTip(i)}
              onFocus={() => setTip(i)}
              className={`ubar h-full min-w-0 flex-1 cursor-pointer ${stateMeta[d].bar}`}
              style={{ ["--ud" as never]: `${i * 5}ms` }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] tracking-wider text-dim uppercase">
          <span>90 days ago</span>
          <span>{incidents > 0 ? `${incidents} incident day${incidents > 1 ? "s" : ""}` : "no incident days"}</span>
          <span>today</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span className="font-mono text-lg font-semibold text-snow tabular-nums">{pct.toFixed(2)}%</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] text-ok uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          ok
        </span>
      </div>
    </Reveal>
  );
}

export default function UptimeGrid() {
  return (
    <div className="border border-edge bg-pit/70 px-5 pt-2 pb-4 sm:px-7">
      {COMPONENTS.map((c, i) => (
        <ComponentRow key={c.id} comp={c} index={i} />
      ))}
      <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-edge/70 pt-4 font-mono text-[11px] text-dim">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 bg-ok/65" /> operational
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 bg-warn" /> degraded performance
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 bg-crit" /> partial / full outage
        </span>
        <span className="ml-auto hidden text-edgehi sm:inline">hover a bar for detail</span>
      </div>
    </div>
  );
}

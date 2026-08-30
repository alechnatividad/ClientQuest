import { useState } from "react";
import { INCIDENTS, type Incident } from "../lib/data";
import { Reveal, StatusChip, usePrefersReducedMotion } from "../lib/hooks";

const sevTone = { major: "crit", minor: "warn", maintenance: "info" } as const;
const sevLabel = { major: "major", minor: "minor", maintenance: "scheduled" } as const;
const stateTone: Record<string, "crit" | "warn" | "info" | "ok"> = {
  investigating: "crit",
  identified: "warn",
  monitoring: "info",
  resolved: "ok",
};

function IncidentCard({ inc, index }: { inc: Incident; index: number }) {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <Reveal delay={index * 90} as="li" className="relative pl-8 sm:pl-10">
      {/* rail node */}
      <span
        className={`absolute top-1.5 left-[7px] h-3 w-3 border-2 sm:left-[11px] ${
          inc.severity === "major"
            ? "border-crit bg-crit/30"
            : inc.severity === "minor"
              ? "border-warn bg-warn/30"
              : "border-glow bg-glow/30"
        }`}
        aria-hidden="true"
      />

      <article
        className={`border bg-pit/70 transition-all duration-300 ${
          open ? "border-edgehi shadow-[0_10px_40px_-18px_rgba(0,0,0,0.8)]" : "border-edge hover:border-edgehi"
        }`}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left"
        >
          <StatusChip tone={sevTone[inc.severity]} label={sevLabel[inc.severity]} />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-semibold tracking-wide text-snow">{inc.title}</h3>
            <p className="mt-0.5 font-mono text-[11px] text-dim">
              {inc.id} · {inc.date} · affects {inc.affected.join(", ")}
            </p>
          </div>
          <span className="flex items-center gap-3">
            {inc.resolved ? (
              <span className="font-mono text-[11px] tracking-[0.18em] text-ok uppercase">resolved</span>
            ) : (
              <span className="font-mono text-[11px] tracking-[0.18em] text-glow uppercase">upcoming</span>
            )}
            <svg
              viewBox="0 0 16 16"
              className={`h-3.5 w-3.5 text-fog transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              fill="none"
              aria-hidden="true"
            >
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {open && (
          <ol className="border-t border-edge/70 px-5 py-4">
            {inc.updates.map((u, i) => (
              <li
                key={i}
                className={reduced ? "" : "motion-cell"}
                style={{ animationDelay: reduced ? "0ms" : `${i * 70}ms` }}
              >
                <div className="flex flex-wrap items-center gap-3 py-2">
                  <span className="w-28 shrink-0 font-mono text-[11px] text-dim tabular-nums">{u.at}</span>
                  <StatusChip tone={stateTone[u.state]} label={u.state} />
                </div>
                <p className="pb-3 pl-0 text-sm leading-relaxed text-fog sm:pl-28">{u.note}</p>
                {i < inc.updates.length - 1 && <div className="ml-14 hidden h-3 w-px bg-edge sm:block" />}
              </li>
            ))}
          </ol>
        )}
      </article>
    </Reveal>
  );
}

export default function IncidentLog() {
  return (
    <div className="relative">
      <span className="absolute top-2 bottom-2 left-[12px] w-px bg-gradient-to-b from-edgehi via-edge to-transparent sm:left-[16px]" aria-hidden="true" />
      <ul className="space-y-4">
        {INCIDENTS.map((inc, i) => (
          <IncidentCard key={inc.id} inc={inc} index={i} />
        ))}
      </ul>
    </div>
  );
}

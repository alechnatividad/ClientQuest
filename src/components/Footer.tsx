import { useUtcClock } from "../lib/hooks";

export default function Footer() {
  const clock = useUtcClock();
  return (
    <footer className="border-t border-edge bg-pit/50">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <p className="font-display flex items-center gap-2.5 text-sm font-bold tracking-[0.2em] text-snow uppercase">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-ok" fill="none" aria-hidden="true">
                <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M9 10l3 2.5L9 15M13.5 15h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              qwen//coder ops
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-dim">
              Unofficial demonstration board. Every metric, probe and incident on this
              page is generated locally in your browser and does{" "}
              <span className="text-fog">not</span> reflect live Qwen, DashScope or
              Alibaba Cloud telemetry. For ground truth, use the official channels
              listed above.
            </p>
          </div>

          <div className="flex gap-12 font-mono text-xs">
            <div>
              <p className="text-[10px] tracking-[0.25em] text-dim uppercase">rendered</p>
              <p className="mt-1.5 text-fog tabular-nums">{clock}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.25em] text-dim uppercase">build</p>
              <p className="mt-1.5 text-fog">v2.4.1-sim</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.25em] text-dim uppercase">poller</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-ok">
                <span className="h-1.5 w-1.5 rounded-full bg-ok motion-blink" />
                healthy
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-edge/60 pt-5 font-mono text-[11px] text-dim">
          <span>status board concept · not affiliated with Alibaba Cloud or the Qwen team</span>
          <span>
            sig <span className="text-fog">9f31·ok·2214</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

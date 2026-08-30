import Masthead from "./components/Masthead";
import Ticker from "./components/Ticker";
import UptimeGrid from "./components/UptimeGrid";
import LatencyPanel from "./components/LatencyPanel";
import ProbePanel from "./components/ProbePanel";
import IncidentLog from "./components/IncidentLog";
import Subscribe from "./components/Subscribe";
import Footer from "./components/Footer";
import { SectionHead, useUtcClock } from "./lib/hooks";

function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* drifting signal glows */}
      <div className="fx-glow motion-drift-a -top-40 left-[-10%] h-[480px] w-[480px] bg-[radial-gradient(circle,rgba(61,220,151,0.13),transparent_65%)]" />
      <div className="fx-glow motion-drift-b top-[30%] right-[-12%] h-[560px] w-[560px] bg-[radial-gradient(circle,rgba(99,226,242,0.09),transparent_65%)]" />
      <div className="fx-glow bottom-[-20%] left-[20%] h-[420px] w-[420px] bg-[radial-gradient(circle,rgba(61,220,151,0.06),transparent_65%)]" />
      {/* blueprint grid */}
      <div className="fx-grid absolute inset-0" />
      {/* scanlines + vignette */}
      <div className="fx-scanlines absolute inset-0" />
      <div className="fx-vignette absolute inset-0" />
    </div>
  );
}

function Header() {
  const clock = useUtcClock();
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-ink/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <a href="#top" className="font-display flex items-center gap-2.5 text-sm font-bold tracking-[0.2em] text-snow uppercase">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-ok" fill="none" aria-hidden="true">
            <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9 10l3 2.5L9 15M13.5 15h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          qwen<span className="text-ok">//</span>coder&nbsp;ops
        </a>

        <nav className="hidden items-center gap-6 font-mono text-[11px] tracking-[0.18em] text-fog uppercase md:flex">
          <a href="#components" className="transition-colors duration-200 hover:text-ok">components</a>
          <a href="#latency" className="transition-colors duration-200 hover:text-ok">latency</a>
          <a href="#incidents" className="transition-colors duration-200 hover:text-ok">incidents</a>
          <a href="#alerts" className="transition-colors duration-200 hover:text-ok">alerts</a>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden border border-edge bg-pit px-3 py-1.5 font-mono text-[11px] text-fog tabular-nums sm:inline-block">
            {clock}
          </span>
          <span className="border border-warn/40 bg-warn/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.2em] text-warn uppercase">
            sim
          </span>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div id="top" className="relative min-h-screen">
      <BackgroundFX />
      <div className="relative z-10">
        <Header />

        <main className="mx-auto max-w-6xl px-5 sm:px-8">
          <Masthead />
        </main>

        <Ticker />

        <main className="mx-auto max-w-6xl px-5 sm:px-8">
          {/* 01 — components */}
          <section id="components" className="scroll-mt-24 pt-16 pb-4">
            <SectionHead index="01" note="90-day history" title="Component uptime" />
            <UptimeGrid />
          </section>

          {/* 02 — latency + probes */}
          <section id="latency" className="scroll-mt-24 pt-12 pb-4">
            <SectionHead index="02" note="inference edge" title="Latency & reachability" />
            <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
              <LatencyPanel />
              <ProbePanel />
            </div>
          </section>

          {/* 03 — incidents */}
          <section id="incidents" className="scroll-mt-24 pt-12 pb-4">
            <SectionHead index="03" note="postmortems attached" title="Incident log" />
            <IncidentLog />
          </section>

          {/* 04 — alerts */}
          <section id="alerts" className="scroll-mt-24 pt-12 pb-20">
            <SectionHead index="04" note="notification wiring" title="Stay on the wire" />
            <Subscribe />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

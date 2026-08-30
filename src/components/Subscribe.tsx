import { useState, type FormEvent } from "react";
import { Reveal } from "../lib/hooks";

const CHANNELS = [
  { name: "Email digest", desc: "incident + weekly summary", on: true },
  { name: "Webhook", desc: "POST to your ops channel", on: true },
  { name: "RSS / Atom", desc: "poll from your monitor", on: true },
  { name: "SMS", desc: "major severity only", on: false },
];

const OFFICIAL = [
  { label: "StatusGator · Qwen", href: "https://statusgator.com/services/qwen" },
  { label: "Entireweb · Qwen status", href: "https://www.entireweb.com/status/qwen" },
  { label: "Alibaba Cloud status", href: "https://status.alibabacloud.com" },
  { label: "QwenLM on GitHub", href: "https://github.com/QwenLM" },
];

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  function submit(e: FormEvent) {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!ok) {
      setState("error");
      return;
    }
    setState("done");
  }

  return (
    <Reveal>
      <div className="relative overflow-hidden border border-edge bg-pit/80">
        {/* corner accents */}
        <span className="absolute top-0 left-0 h-10 w-10 border-t-2 border-l-2 border-ok/60" aria-hidden="true" />
        <span className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-ok/60" aria-hidden="true" />

        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase">alert channels</p>
            <h2 className="font-display mt-3 text-2xl leading-tight font-bold tracking-wide text-snow uppercase sm:text-[2rem]">
              Get paged before
              <br />
              <span className="text-ok">your users do.</span>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fog">
              Alerts fire within 60 seconds of detection, with component, region and
              error signature attached. Digests roll up every Monday at 08:00 UTC.
            </p>

            {state !== "done" ? (
              <form onSubmit={submit} className="mt-6 flex max-w-md flex-col gap-2 sm:flex-row" noValidate>
                <div className="flex-1">
                  <label htmlFor="alert-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="alert-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state === "error") setState("idle");
                    }}
                    placeholder="oncall@yourteam.dev"
                    className={`w-full border bg-ink px-4 py-3 font-mono text-sm text-snow placeholder:text-dim focus:outline-none ${
                      state === "error" ? "border-crit/70" : "border-edge focus:border-ok/60"
                    } transition-colors duration-200`}
                  />
                </div>
                <button
                  type="submit"
                  className="font-display border border-ok/60 bg-ok/15 px-6 py-3 text-xs font-semibold tracking-[0.2em] text-ok uppercase transition-all duration-200 hover:bg-ok/25 hover:shadow-[0_0_30px_-8px_rgba(61,220,151,0.7)]"
                >
                  Subscribe
                </button>
              </form>
            ) : (
              <div className="motion-cell mt-6 flex max-w-md items-center gap-3 border border-ok/50 bg-ok/10 px-4 py-3.5">
                <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-ok" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6.5 10.5l2.3 2.3L13.5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="font-mono text-sm text-ok">
                  {email.trim()} is on the wire. Confirmation sent — first digest Monday 08:00 UTC.
                </p>
              </div>
            )}
            {state === "error" && (
              <p className="mt-2 font-mono text-xs text-crit" role="alert">
                That address doesn't parse — try the full oncall@ format.
              </p>
            )}
          </div>

          <div>
            <div className="grid grid-cols-2 gap-3">
              {CHANNELS.map((c) => (
                <div
                  key={c.name}
                  className={`border px-4 py-3 transition-colors duration-200 ${
                    c.on ? "border-edge bg-cell/60 hover:border-edgehi" : "border-edge/60 opacity-50"
                  }`}
                >
                  <p className="font-display flex items-center gap-2 text-[13px] font-semibold text-snow">
                    {c.name}
                    {!c.on && <span className="font-mono text-[9px] tracking-widest text-dim uppercase">soon</span>}
                  </p>
                  <p className="mt-1 font-mono text-[10.5px] text-dim">{c.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 border border-edge/70 bg-ink/50 p-4">
              <p className="font-mono text-[10.5px] tracking-[0.22em] text-dim uppercase">need the real thing?</p>
              <ul className="mt-2.5 space-y-1.5">
                {OFFICIAL.map((o) => (
                  <li key={o.href}>
                    <a
                      href={o.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-2 font-mono text-xs text-fog transition-colors duration-200 hover:text-glow"
                    >
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-dim transition-colors group-hover:text-glow" fill="none" aria-hidden="true">
                        <path d="M2 10L10 2M4 2h6v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {o.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

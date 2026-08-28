import { useRef } from "react";
import { ArrowRight, Check, Gem } from "lucide-react";
import { burstFrom, cannons } from "../lib/confetti";
import { Reveal } from "../lib/motion";

const ASSURANCES = ["No credit card", "Free for 5 projects", "2-minute setup"];

export default function FinalCta() {
  const btnRef = useRef<HTMLButtonElement>(null);

  const celebrate = () => {
    if (btnRef.current) burstFrom(btnRef.current);
    cannons();
  };

  return (
    <section id="cta" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-quest/25 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950 px-6 py-16 text-center sm:px-14">
            {/* ambient */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="bg-dots absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_70%_80%_at_50%_20%,black,transparent)]" />
              <div className="absolute -top-24 left-1/2 h-64 w-[480px] -translate-x-1/2 rounded-full bg-quest/20 blur-[110px]" />
              <div className="absolute -bottom-20 left-[10%] h-48 w-48 rounded-full bg-emerald-500/10 blur-[90px]" />
              <div className="absolute -bottom-16 right-[8%] h-40 w-40 rounded-full bg-amber-500/10 blur-[80px]" />
            </div>

            <div className="relative">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] shadow-xl shadow-quest/30">
                <Gem className="h-6 w-6 text-white" strokeWidth={2.25} />
              </span>

              <h2 className="mx-auto mt-7 max-w-2xl font-display text-3xl font-bold leading-[1.18] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
                Ready to make every sign-off{" "}
                <span className="text-[#10B981]">effortless</span>?
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
                Spin up your first project board in minutes — definitive feedback, locked scope, and clients who
                actually enjoy reviewing.
              </p>

              <button
                ref={btnRef}
                onClick={celebrate}
                className="group relative mt-10 inline-flex items-center gap-2.5 rounded-full bg-[#8B5CF6] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-600/35 transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-400 hover:shadow-2xl hover:shadow-violet-500/50 active:translate-y-0 active:scale-95"
              >
                Start your first project
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                {ASSURANCES.map((a) => (
                  <span key={a} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#10B981]" strokeWidth={3} /> {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

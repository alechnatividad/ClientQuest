import { ArrowUp, Dribbble, Gem, Github, Twitter } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Visual Kanban board", href: "#features" },
  { label: "Live demo", href: "#demo" },
  { label: "The workflow", href: "#loop" },
  { label: "Get started", href: "#cta" },
];

const RESOURCE_LINKS = [
  { label: "Client stories", href: "#stories" },
  { label: "Why it works", href: "#features" },
  { label: "Back to top", href: "#top" },
];

const SOCIALS = [
  { icon: Twitter, href: "https://twitter.com", label: "ClientQuest on Twitter" },
  { icon: Github, href: "https://github.com", label: "ClientQuest on GitHub" },
  { icon: Dribbble, href: "https://dribbble.com", label: "ClientQuest on Dribbble" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-slate-800/80 bg-slate-950">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <a href="#top" className="group inline-flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep shadow-lg shadow-quest/25 transition-transform duration-300 group-hover:-rotate-12">
                <Gem className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">
                <span className="text-white">Client</span>
                <span className="text-[#10B981]">Quest</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              The modern client approval portal for freelancers and agencies. Share work, collect definitive
              feedback, and lock scope in one click.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-quest hover:text-quest"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-slate-500">PRODUCT</p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-slate-500">RESOURCES</p>
            <ul className="mt-4 space-y-2.5">
              {RESOURCE_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
          <p className="text-sm text-slate-600">© 2026 ClientQuest. All rights reserved.</p>
          <a
            href="#top"
            className="group flex items-center gap-2 text-sm text-slate-500 transition-colors duration-200 hover:text-white"
          >
            Back to top
            <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-800 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-quest group-hover:text-quest">
              <ArrowUp className="h-3.5 w-3.5" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}

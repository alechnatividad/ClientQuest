import { useEffect, useState } from "react";
import { ArrowUpRight, Gem } from "lucide-react";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Live demo", href: "#demo" },
  { label: "Workflow", href: "#loop" },
  { label: "Stories", href: "#stories" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-800/80 bg-slate-950/85 py-3 shadow-lg shadow-black/20 backdrop-blur-md"
          : "border-b border-transparent bg-transparent py-5"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <a href="#top" className="group flex items-center gap-2.5" aria-label="ClientQuest home">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep shadow-lg shadow-quest/30 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-105">
            <Gem className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-white">Client</span>
            <span className="text-[#10B981]">Quest</span>
          </span>
        </a>

        {/* Center links */}
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium text-slate-400 transition-colors duration-200 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-quest after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Circular CTA */}
        <a
          href="#cta"
          aria-label="Get started"
          className="group grid h-11 w-11 place-items-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 transition-all duration-300 hover:border-quest hover:bg-quest hover:text-white hover:shadow-lg hover:shadow-quest/40"
        >
          <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </nav>
    </header>
  );
}

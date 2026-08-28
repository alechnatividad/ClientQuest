import { Quote } from "lucide-react";
import { Reveal } from "../lib/motion";

const STORIES: { quote: string; name: string; role: string; initials: string; tint: string; chip: string }[] = [
  {
    quote:
      "Approvals used to be the scariest part of every project. Now clients sign off inside the portal before our next check-in — scope creep simply vanished.",
    name: "Maya Reyes",
    role: "Founder, Studio Northline",
    initials: "MR",
    tint: "bg-violet-500/20 text-violet-300",
    chip: "3.4× faster sign-off",
  },
  {
    quote:
      "Approval time went from nine days to two. The board does the chasing for us — clients can see exactly what's waiting on them.",
    name: "Jonas Klein",
    role: "Ops Lead, Framewerk",
    initials: "JK",
    tint: "bg-emerald-500/20 text-emerald-300",
    chip: "9 days → 2",
  },
  {
    quote:
      "It's the first portal our clients actually log into. I checked the analytics — 94% weekly active. On a client portal.",
    name: "Priya Shah",
    role: "PM, Orbit Labs",
    initials: "PS",
    tint: "bg-amber-500/20 text-amber-300",
    chip: "94% weekly active",
  },
  {
    quote:
      "We presented a packaging system and the client approved it on the call, in the portal, with the whole audit trail. No “let me think about it”.",
    name: "Theo Marsh",
    role: "Creative Director, Brew & Co",
    initials: "TM",
    tint: "bg-sky-500/20 text-sky-300",
    chip: "Approved on the call",
  },
  {
    quote:
      "Feedback finally lives where the work lives. Every note is pinned to a deliverable, every sign-off is one click. Email threads are extinct here.",
    name: "Ana Duarte",
    role: "Producer, Nimbus",
    initials: "AD",
    tint: "bg-rose-500/20 text-rose-300",
    chip: "Zero chase emails",
  },
  {
    quote:
      "Onboarding a new client takes one link. They understand the board in minutes and start asking what's next to review.",
    name: "Chris Lam",
    role: "Partner, Atlas Co.",
    initials: "CL",
    tint: "bg-violet-500/20 text-violet-300",
    chip: "1-link onboarding",
  },
];

function StoryCard({ quote, name, role, initials, tint, chip }: (typeof STORIES)[number]) {
  return (
    <article className="mr-5 w-[320px] shrink-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-600 sm:w-[360px]">
      <div className="flex items-center justify-between">
        <Quote className="h-5 w-5 text-quest/70" fill="currentColor" strokeWidth={0} />
        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-[#10B981]">
          {chip}
        </span>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-slate-300">“{quote}”</p>
      <footer className="mt-5 flex items-center gap-3 border-t border-slate-800 pt-4">
        <span className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${tint}`}>{initials}</span>
        <span>
          <span className="block text-sm font-semibold text-white">{name}</span>
          <span className="block text-xs text-slate-500">{role}</span>
        </span>
      </footer>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section id="stories" className="relative overflow-hidden py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.28em] text-quest">STORIES</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Trusted by studios that <span className="text-[#10B981]">ship.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-slate-500">
            Hover to pause the feed. Every studio below moved from email threads to one approval portal.
          </p>
        </Reveal>
      </div>

      <Reveal delay={150}>
        <div className="marquee-paused mt-12 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="animate-marquee-slow flex w-max">
            {[...STORIES, ...STORIES].map((s, i) => (
              <StoryCard key={i} {...s} />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

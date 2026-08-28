import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  Clock,
  Database,
  FolderKanban,
  Route,
  ShieldCheck,
  Settings2,
  Users,
} from "lucide-react";
import { useAuth } from "../../lib/auth";

const FOUNDATION = [
  { icon: ShieldCheck, label: "Authentication & session restore", done: true },
  { icon: Route, label: "Routing, app shell & protected routes", done: true },
  { icon: Users, label: "Passwordless client portal route (/p/:token)", done: true },
  { icon: Database, label: "Database schema, project & client CRUD", done: false },
];

const QUICK_LINKS = [
  { to: "/app/projects", icon: FolderKanban, title: "Projects", desc: "Boards, phases and deliverables" },
  { to: "/app/clients", icon: Users, title: "Clients", desc: "People you share work with" },
  { to: "/app/settings", icon: Settings2, title: "Settings", desc: "Account, connection & branding" },
];

export default function DashboardPage() {
  const { user, configured } = useAuth();
  const email = user?.email ?? "owner";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="animate-pop">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br from-quest to-quest-deep font-display text-lg font-bold text-white shadow-lg shadow-quest/30">
            {initials}
          </span>
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#10B981]">OWNER DASHBOARD</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, <span className="text-violet-300">{email.split("@")[0]}</span>
            </h1>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${
            configured
              ? "border-emerald-400/30 bg-emerald-400/10 text-[#10B981]"
              : "border-amber-400/30 bg-amber-400/10 text-[#F59E0B]"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-[#10B981]" : "bg-[#F59E0B]"}`} />
          {configured ? "Supabase connected" : "Supabase not configured"}
        </span>
      </div>

      {/* foundation checklist */}
      <section className="mt-10 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-white">Application foundation</h2>
          <span className="rounded-full bg-quest/15 px-3 py-1 text-[11px] font-bold tracking-wide text-violet-300">
            PHASE 1 COMPLETE
          </span>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {FOUNDATION.map((f) => (
            <li
              key={f.label}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors duration-200 ${
                f.done
                  ? "border-emerald-500/20 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
                  : "border-dashed border-slate-700 bg-slate-900/40"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  f.done ? "bg-emerald-500/15 text-[#10B981]" : "bg-amber-400/10 text-[#F59E0B]"
                }`}
              >
                {f.done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Clock className="h-4 w-4" />}
              </span>
              <div className="flex items-center gap-2.5">
                <f.icon className="h-4 w-4 shrink-0 text-slate-500" />
                <span className={`text-sm font-medium ${f.done ? "text-slate-200" : "text-slate-500"}`}>{f.label}</span>
              </div>
              {!f.done && (
                <span className="ml-auto shrink-0 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-[#F59E0B]">
                  PHASE 2
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* quick links */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((l, i) => (
          <Link
            key={l.to}
            to={l.to}
            style={{ transitionDelay: `${i * 40}ms` }}
            className="group rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-quest/60 hover:bg-slate-800/70 hover:shadow-2xl hover:shadow-quest/10"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 transition-transform duration-300 group-hover:scale-110">
                <l.icon className="h-5 w-5 text-[#10B981]" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-600 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-quest" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-white">{l.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{l.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

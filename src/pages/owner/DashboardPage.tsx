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
import { useWorkspace } from "../../lib/workspace";
import { formatDate, isOverdue, useClients, useProjects } from "../../lib/repo";
import { ProjectStatusPill } from "../../components/app/ui";

const FOUNDATION = [
  { icon: ShieldCheck, label: "Authentication & session restore", done: true },
  { icon: Route, label: "Routing, app shell & protected routes", done: true },
  { icon: Users, label: "Passwordless client portal route (/p/:token)", done: true },
  { icon: Database, label: "Workspace bootstrap, client & project CRUD", done: true },
];

const QUICK_LINKS = [
  { to: "/app/projects", icon: FolderKanban, title: "Projects", desc: "Statuses, due dates and client links" },
  { to: "/app/clients", icon: Users, title: "Clients", desc: "People you share work with" },
  { to: "/app/settings", icon: Settings2, title: "Settings", desc: "Account, connection & branding" },
];

export default function DashboardPage() {
  const { user, configured } = useAuth();
  const { workspace, status } = useWorkspace();
  const workspaceId = workspace?.id ?? null;

  const { rows: projects, loading: projectsLoading } = useProjects(workspaceId);
  const { rows: clients, loading: clientsLoading } = useClients(workspaceId);

  const email = user?.email ?? "owner";
  const initials = email.slice(0, 2).toUpperCase();
  const loading = projectsLoading || clientsLoading || status !== "ready";

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const waitingReview = projects.filter((p) => p.status === "waiting_review").length;
  const activeClients = clients.filter((c) => c.status === "active").length;
  const recent = projects.slice(0, 5);

  const stats = [
    { label: "Active projects", value: activeProjects, accent: "text-violet-300" },
    { label: "Waiting review", value: waitingReview, accent: "text-[#F59E0B]" },
    { label: "Clients", value: activeClients, accent: "text-[#10B981]" },
    { label: "Total projects", value: projects.length, accent: "text-white" },
  ];

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
            {workspace && <p className="mt-0.5 text-[13px] text-slate-500">Workspace · {workspace.name}</p>}
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

      {/* live stats */}
      <section className="mt-10 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-white">Right now</h2>
          <span className="rounded-full bg-quest/15 px-3 py-1 text-[11px] font-bold tracking-wide text-violet-300">
            PHASE 2B · LIVE DATA
          </span>
        </div>

        {loading ? (
          <div className="mt-6 grid animate-pulse grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="space-y-2">
                <div className="h-8 w-12 rounded bg-slate-700/60" />
                <div className="h-3 w-24 rounded bg-slate-700/40" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-slate-700/50">
            {stats.map((s, i) => (
              <div key={s.label} className={i === 0 ? "" : "sm:pl-6"}>
                <p className={`font-display text-3xl font-bold tabular-nums ${s.accent}`}>{s.value}</p>
                <p className="mt-1 text-[13px] font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* recent projects + foundation */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-white">Recent projects</h2>
            <Link
              to="/app/projects"
              className="group inline-flex items-center gap-1 text-xs font-bold text-violet-300 transition-colors hover:text-violet-200"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 animate-pulse space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-700/30" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
              <p className="text-sm text-slate-500">No projects yet — your board is waiting.</p>
              <Link
                to="/app/projects"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-quest to-quest-deep px-5 py-2 text-xs font-bold text-white shadow-lg shadow-quest/25 transition-all duration-200 hover:brightness-110"
              >
                <FolderKanban className="h-3.5 w-3.5" /> Create the first one
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-700/40">
              {recent.map((p) => {
                const overdue = isOverdue(p.due_date) && p.status !== "approved" && p.status !== "archived";
                return (
                  <li key={p.id}>
                    <Link
                      to={`/app/projects/${p.id}`}
                      className="group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-200 hover:bg-slate-700/25"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white transition-colors group-hover:text-violet-200">
                          {p.name}
                        </span>
                        {p.due_date && (
                          <span className={`text-[12px] ${overdue ? "font-semibold text-[#F59E0B]" : "text-slate-500"}`}>
                            {overdue ? "Overdue · " : "Due "}
                            {formatDate(p.due_date)}
                          </span>
                        )}
                      </span>
                      <ProjectStatusPill status={p.status} />
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-quest" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* foundation checklist */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-white">Foundation</h2>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#10B981]">
              PHASE 2B COMPLETE
            </span>
          </div>
          <ul className="mt-5 space-y-3">
            {FOUNDATION.map((f) => (
              <li
                key={f.label}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-200 ${
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
                <f.icon className="h-4 w-4 shrink-0 text-slate-500" />
                <span className={`text-[13px] font-medium ${f.done ? "text-slate-200" : "text-slate-500"}`}>{f.label}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

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

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FolderKanban, Gem, LayoutDashboard, LogOut, Menu, Settings2, Users, X } from "lucide-react";
import { useAuth } from "../../lib/auth";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/projects", label: "Projects", icon: FolderKanban, end: false },
  { to: "/app/clients", label: "Clients", icon: Users, end: false },
  { to: "/app/settings", label: "Settings", icon: Settings2, end: false },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const email = user?.email ?? "owner@studio.com";
  const initials = email.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const linkClass = (active: boolean) =>
    `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      active ? "bg-quest/15 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
    }`;

  return (
    <div className="relative min-h-screen bg-slate-950 font-body text-slate-200 antialiased">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="bg-dots absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-quest/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500/[0.05] blur-[130px]" />
      </div>

      {/* ── desktop sidebar ─────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur lg:flex">
        <NavLink to="/" className="flex items-center gap-2.5 px-5 py-5" aria-label="ClientQuest home">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep shadow-lg shadow-quest/30 transition-transform duration-300 hover:-rotate-12">
            <Gem className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-white">Client</span>
            <span className="text-[#10B981]">Quest</span>
          </span>
        </NavLink>

        <div className="mx-4 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-3">
          <p className="text-[10px] font-bold tracking-[0.18em] text-slate-600">OWNER WORKSPACE</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{email}</p>
          <p className="text-[11px] text-slate-500">Studio plan</p>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#10B981] transition-all duration-300 ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                    }`}
                  />
                  <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-violet-300" : ""}`} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{email}</p>
              <p className="truncate text-[11px] text-slate-500">Owner</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:bg-slate-900 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── mobile top bar + menu ───────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-5 py-3.5">
          <NavLink to="/" className="flex items-center gap-2" aria-label="ClientQuest home">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep">
              <Gem className="h-4 w-4 text-white" strokeWidth={2.25} />
            </span>
            <span className="font-display text-base font-bold">
              <span className="text-white">Client</span>
              <span className="text-[#10B981]">Quest</span>
            </span>
          </NavLink>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
              {initials}
            </span>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="animate-pop border-t border-slate-800/80 bg-slate-950/95 px-5 py-4">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive ? "bg-quest/15 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleSignOut}
                className="mt-2 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-900 hover:text-white"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* ── page content ────────────────────────────────────────── */}
      <main className="relative lg:pl-64">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

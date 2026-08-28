import { useNavigate } from "react-router-dom";
import { Brush, Check, Database, KeyRound, LogOut, Mail, X } from "lucide-react";
import { useAuth } from "../../lib/auth";

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
          ok ? "bg-emerald-400/10 text-[#10B981]" : "bg-amber-400/10 text-[#F59E0B]"
        }`}
      >
        {ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
        {ok ? "Detected" : "Missing"}
      </span>
    </li>
  );
}

export default function SettingsPage() {
  const { user, configured, signOut } = useAuth();
  const navigate = useNavigate();

  const email = user?.email ?? "—";
  const provider = (user?.app_metadata?.provider as string | undefined) ?? "email";
  const urlSet = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const keySet = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="animate-pop max-w-3xl">
      <p className="text-xs font-bold tracking-[0.22em] text-[#10B981]">SETTINGS</p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Your workspace, your rules
      </h1>

      {/* account */}
      <section className="mt-10 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
          <Mail className="h-4 w-4 text-violet-300" /> Account
        </h2>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
              {email.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{email}</p>
              <p className="text-xs text-slate-500">
                Signed in via <span className="font-semibold text-slate-300">{provider}</span> · Owner role
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </section>

      {/* connection */}
      <section className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
          <Database className="h-4 w-4 text-[#10B981]" /> Supabase connection
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
          Read from environment variables at build time — credentials never live in source code.
        </p>
        <ul className="mt-4 space-y-2.5">
          <StatusRow label="VITE_SUPABASE_URL" ok={urlSet} />
          <StatusRow label="VITE_SUPABASE_ANON_KEY" ok={keySet} />
        </ul>
        <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-slate-500">
          <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
          {configured
            ? "Client is live. Auth calls hit your Supabase project directly."
            : "Copy .env.example → .env.local, fill both values, restart the dev server, and this panel turns green."}
        </p>
      </section>

      {/* branding */}
      <section className="mt-6 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
            <Brush className="h-4 w-4 text-[#F59E0B]" /> Workspace branding
          </h2>
          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-[#F59E0B]">PHASE 2</span>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          Studio name, logo and accent color — applied to every client portal you share. Persists to the database
          once the schema lands.
        </p>
      </section>
    </div>
  );
}

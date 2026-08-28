import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Gem,
  KeyRound,
  Link2,
  Loader2,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../lib/auth";

type Status = "idle" | "sending" | "sent" | "error";

const BRAND_POINTS = [
  { icon: KeyRound, text: "Magic-link sign-in — no passwords to forget" },
  { icon: Link2, text: "Clients enter through secure project links only" },
  { icon: ShieldCheck, text: "Every approval locks scope and logs itself" },
];

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { configured, user, initializing, signInWithMagicLink, signInWithGoogle } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Already signed in? Straight to the app.
  if (!initializing && user) return <Navigate to={from} replace />;

  const sendMagicLink = async () => {
    if (!email.includes("@")) {
      setStatus("error");
      setErrorMsg("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    const { error } = await signInWithMagicLink(email.trim());
    if (error) {
      setStatus("error");
      setErrorMsg(error);
    } else {
      setStatus("sent");
    }
  };

  const handleMagicLink = (e: FormEvent) => {
    e.preventDefault();
    void sendMagicLink();
  };

  const handleGoogle = async () => {
    setErrorMsg("");
    const { error } = await signInWithGoogle();
    if (error) {
      setStatus("error");
      setErrorMsg(error);
    }
    // On success Supabase redirects the browser to Google — nothing else to do.
  };

  return (
    <div className="relative flex min-h-screen bg-slate-950 font-body text-slate-200 antialiased">
      {/* ── brand panel (desktop) ───────────────────────────────── */}
      <div className="relative hidden w-[46%] overflow-hidden border-r border-slate-800/80 bg-gradient-to-b from-purple-900 via-slate-900 to-slate-950 lg:block">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="bg-dots absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_80%_70%_at_30%_20%,black,transparent)]" />
          <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-quest/20 blur-[130px]" />
          <div className="absolute bottom-16 right-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-[110px]" />
        </div>

        {/* floating proof chip */}
        <div aria-hidden className="animate-float-slow absolute right-10 top-24">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/85 p-4 shadow-2xl shadow-black/50 backdrop-blur">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-[#10B981]">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Homepage v2 approved</p>
              <p className="text-xs text-slate-500">Atlas Co. · just now</p>
            </div>
          </div>
        </div>

        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="group flex w-fit items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep shadow-lg shadow-quest/30 transition-transform duration-300 group-hover:-rotate-12">
              <Gem className="h-5 w-5 text-white" strokeWidth={2.25} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-white">Client</span>
              <span className="text-[#10B981]">Quest</span>
            </span>
          </Link>

          <div>
            <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white">
              Run your studio.
              <br />
              <span className="text-[#10B981]">Ship</span> what clients{" "}
              <span className="text-[#F59E0B]">approve</span>.
            </h1>
            <ul className="mt-10 space-y-5">
              {BRAND_POINTS.map((p) => (
                <li key={p.text} className="flex items-center gap-3.5 text-[15px] text-slate-300">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-700/70 bg-slate-900/70">
                    <p.icon className="h-4 w-4 text-violet-300" />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-600">© 2026 ClientQuest — the modern client approval portal.</p>
        </div>
      </div>

      {/* ── form panel ──────────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-12 sm:px-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-quest/15 blur-[110px]" />
        </div>

        <div className="animate-pop relative w-full max-w-md">
          <Link
            to="/"
            className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to site
          </Link>

          {/* mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep shadow-lg shadow-quest/30">
              <Gem className="h-5 w-5 text-white" strokeWidth={2.25} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-white">Client</span>
              <span className="text-[#10B981]">Quest</span>
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Owner sign in</h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-slate-400">
            For freelancers and agencies running projects. We'll email you a secure sign-in link.
          </p>

          {/* honest setup banner when env vars are missing */}
          {!configured && (
            <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[#F59E0B]">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Supabase isn't connected yet
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                Copy <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200">.env.example</code> to{" "}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200">.env.local</code> and add{" "}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200">VITE_SUPABASE_URL</code> +{" "}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200">VITE_SUPABASE_PUBLISHABLE_KEY</code>
                , then restart the dev server.
              </p>
            </div>
          )}

          {status === "sent" ? (
            /* ── magic link sent state ── */
            <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 text-[#10B981]">
                <MailCheck className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-white">Check your inbox</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                We sent a sign-in link to <span className="font-semibold text-white">{email}</span>. Click it and
                you'll land straight in your dashboard.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => void sendMagicLink()}
                  disabled={!configured}
                  className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-emerald-400/50 hover:text-[#10B981] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Resend link
                </button>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setEmail("");
                  }}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:text-white"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            /* ── sign-in form ── */
            <form onSubmit={handleMagicLink} className="mt-8">
              <label htmlFor="email" className="text-xs font-bold tracking-[0.18em] text-slate-500">
                EMAIL
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                disabled={!configured}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3.5 text-[15px] text-white placeholder:text-slate-600 transition-all duration-200 focus:border-quest focus:outline-none focus:ring-2 focus:ring-quest/30 disabled:cursor-not-allowed disabled:opacity-50"
              />

              {status === "error" && errorMsg && (
                <p className="mt-2.5 flex items-center gap-1.5 text-[13px] font-medium text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={!configured || status === "sending"}
                className="group mt-5 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#8B5CF6] px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-violet-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-400 hover:shadow-violet-500/45 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending link…
                  </>
                ) : (
                  <>
                    Email me a sign-in link
                    <CheckCircle2 className="h-4 w-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </>
                )}
              </button>

              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-slate-800" />
                <span className="text-xs font-bold tracking-[0.18em] text-slate-600">OR</span>
                <span className="h-px flex-1 bg-slate-800" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={!configured}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-base font-semibold text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-800/80 hover:text-white active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <GoogleMark /> Continue with Google
              </button>
            </form>
          )}

          <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3.5 text-[13px] leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-300">Looking for your project?</span> Clients don't log in here —
            you'll use the secure link your studio shared with you. No account needed.
          </p>
        </div>
      </div>
    </div>
  );
}

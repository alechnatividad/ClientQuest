import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  /** Whether Supabase env vars are present. */
  configured: boolean;
  user: User | null;
  session: Session | null;
  /** True while the initial session is being restored from storage. */
  initializing: boolean;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ────────────────────────────────────────────────────────────────
 * Secure auth return-path handling
 *
 * The path a visitor attempted (e.g. /app/projects/123) is recorded when
 * RequireAuth bounces them to /login, then carried through Supabase via
 * the /auth/callback route. Destinations are strictly whitelisted to
 * internal /app paths — no open redirects.
 * ──────────────────────────────────────────────────────────────── */

const RETURN_TO_KEY = "clientquest:return-to";

/**
 * Allow only internal /app destinations. Rejects:
 *  - anything not starting with "/app" (external URLs, other routes)
 *  - lookalike prefixes like "/apple-something"
 *  - protocol-relative ("//evil.com") and backslash tricks
 */
export function sanitizeReturnPath(candidate: string | null | undefined): string | null {
  if (!candidate || typeof candidate !== "string") return null;
  if (candidate.includes("\\") || candidate.includes("//")) return null;
  if (!candidate.startsWith("/app")) return null;
  const rest = candidate.slice(4);
  if (rest !== "" && !rest.startsWith("/")) return null;
  return candidate;
}

/** Record the attempted protected path (sanitized) for post-auth redirect. */
export function rememberReturnTo(path: string): void {
  const clean = sanitizeReturnPath(path);
  if (!clean) return;
  try {
    sessionStorage.setItem(RETURN_TO_KEY, clean);
  } catch {
    /* storage unavailable — fall back to /app after auth */
  }
}

/** Read (without consuming) the stored destination; used to build callback URLs. */
export function peekStoredReturnTo(): string {
  try {
    return sanitizeReturnPath(sessionStorage.getItem(RETURN_TO_KEY)) ?? "/app";
  } catch {
    return "/app";
  }
}

/** Consume the stored destination, defaulting to /app. */
export function takeStoredReturnTo(): string {
  try {
    const stored = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    return sanitizeReturnPath(stored) ?? "/app";
  } catch {
    return "/app";
  }
}

/** /auth/callback URL carrying the sanitized internal destination. */
export function buildAuthCallbackUrl(): string {
  const returnTo = peekStoredReturnTo();
  return `${window.location.origin}/auth/callback?return_to=${encodeURIComponent(returnTo)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setInitializing(false);
      return;
    }

    // Restore any persisted session on first load.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setInitializing(false);
      })
      .catch(() => setInitializing(false));

    // Keep state in sync with token refreshes, sign-in redirects and sign-outs.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Supabase is not configured on this deployment." };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: buildAuthCallbackUrl() },
    });
    return { error: error?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { error: "Supabase is not configured on this deployment." };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: buildAuthCallbackUrl() },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      user: session?.user ?? null,
      session,
      initializing,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
    }),
    [session, initializing, signInWithMagicLink, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>.");
  return ctx;
}

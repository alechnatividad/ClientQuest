import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** True when both required env vars are present. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

/**
 * The shared Supabase client, initialized with Supabase's publishable key
 * (never a secret/service-role key). `null` when env vars are missing so the
 * app can render honest "not configured" states instead of throwing or
 * faking calls.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, publishableKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

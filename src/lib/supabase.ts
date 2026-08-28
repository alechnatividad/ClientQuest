import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** True when both required env vars are present. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

/**
 * The shared Supabase client, typed against the Phase 2A schema.
 *
 * - Initialized with the publishable key only — a secret/service-role key
 *   must never appear in frontend code or env vars.
 * - `Database` types in src/types/database.ts are manually schema-derived;
 *   regenerate with `supabase gen types typescript --linked` after applying
 *   the migration.
 * - `null` when env vars are missing so the app can render honest
 *   "not configured" states instead of throwing or faking calls.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url as string, publishableKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

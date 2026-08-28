/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://xyzcompany.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable (public) API key, e.g. sb_publishable_... */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

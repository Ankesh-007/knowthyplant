// Single source of truth for the browser Supabase client.
// Used by both the marketplace (public/) and the dashboard (app/).
//
// Config comes from Vite env vars (import.meta.env.VITE_*), injected at build
// time — no server round-trip, no hardcoded secrets in source. The anon key is
// public by design; Row-Level Security is what protects the data.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env (local) or set them in the Netlify build env.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

/** Async accessor kept for existing marketplace callers (`await getSupabase()`). */
export const getSupabase = async () => supabase;

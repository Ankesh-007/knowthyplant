// Marketplace Supabase client — re-exported from the shared module so both
// products use one client and one config source. Config is injected via Vite
// env vars (see shared/supabaseClient.js); the anon key is public by design and
// RLS guards the data. All marketplace modules keep importing `getSupabase`
// from here unchanged.
export { supabase, getSupabase } from '../../shared/supabaseClient.js';

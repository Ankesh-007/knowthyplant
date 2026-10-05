// Auth facade. The rest of the app depends on THIS, not on raw supabase.auth.*
// (keeps auth logic in one place — easy to reason about and swap).
import { getSupabase } from './supabaseClient.js';

export async function signUp({ email, password, role, fullName, phone }) {
  const supabase = await getSupabase();
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { role, full_name: fullName || '', phone: phone || '' } }
  });
}

export async function signIn({ email, password }) {
  const supabase = await getSupabase();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = await getSupabase();
  return supabase.auth.signOut();
}

export async function getSession() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** The current user's profile row (role, name, photo...), or null. */
export async function getProfile() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) {
    console.warn('getProfile:', error.message);
    return null;
  }
  return data;
}

/** Where a role should land after auth. */
export function roleHome(role) {
  return role === 'worker' ? '/onboarding' : '/find-workers';
}

/**
 * Guard a page. Redirects to the landing (with the auth modal open) when
 * signed out. If `role` is given, bounces users of the wrong role to their home.
 * Returns the session when allowed, otherwise null (after redirecting).
 */
export async function requireAuth(role) {
  const session = await getSession();
  if (!session) {
    window.location.href = '/?auth=login';
    return null;
  }
  if (role) {
    const profile = await getProfile();
    if (profile && profile.role !== role) {
      window.location.href = roleHome(profile.role);
      return null;
    }
  }
  return session;
}

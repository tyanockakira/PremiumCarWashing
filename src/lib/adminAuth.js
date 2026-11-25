import { getSupabase } from './supabase.js';

export async function getAdminContext() {
  const supabase = await getSupabase();
  if (!supabase) return { supabase: null, user: null, profile: null };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile, error } = await supabase
    .from('admin_profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile?.is_active) return { supabase, user, profile: null };
  return { supabase, user, profile };
}

export async function signOutAdmin() {
  const supabase = await getSupabase();
  await supabase?.auth.signOut();
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing SUPABASE URL or ANON KEY in environment variables.');
}

// Create a getter function instead of a top-level export
export const getSupabaseClient = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    // SSR: return a dummy client (or throw)
    throw new Error('Supabase client cannot be used during SSR.');
  }

  return createClient(supabaseUrl, supabaseAnon, {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
};
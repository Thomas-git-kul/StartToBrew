import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const _gotSupabaseUrl = !!supabaseUrl;
const _gotSupabaseAnon = !!supabaseAnon;
console.log('Supabase env keys present:', {
  url: _gotSupabaseUrl,
  anonKey: _gotSupabaseAnon,
});

if (!supabaseUrl) {
  throw new Error(
    'Supabase URL not found. Set `EXPO_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` in your environment.'
  );
}

if (!supabaseAnon) {
  throw new Error(
    'Supabase anon key not found. Set `EXPO_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your environment.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
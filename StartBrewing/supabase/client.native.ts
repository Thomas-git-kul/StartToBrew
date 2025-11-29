import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Diagnostic: confirm the expected Supabase env keys are available (logs presence only)
const _gotSupabaseUrl = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
const _gotSupabaseAnon = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
console.log('Supabase env keys present:', {
  url: _gotSupabaseUrl,
  anonKey: _gotSupabaseAnon,
});

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
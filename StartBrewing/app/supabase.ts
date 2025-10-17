import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Read from process.env (or replace with `import { SUPABASE_SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'`
// if you use react-native-dotenv / babel-plugin-inline-dotenv)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
console.log('ENV URL =', JSON.stringify(process.env.EXPO_PUBLIC_SUPABASE_URL));
console.log('ENV KEY starts with =', (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').slice(0, 8));


if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing SUPABASE_SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
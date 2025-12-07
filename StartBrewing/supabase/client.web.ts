import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
	process.env.EXPO_PUBLIC_SUPABASE_URL ||
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	process.env.NEXT_PUBLIC_SUPABASE_URL /* fallback for some CI setups */;
const supabaseAnon =
	process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export const getSupabaseClient = () => createClient(supabaseUrl, supabaseAnon);
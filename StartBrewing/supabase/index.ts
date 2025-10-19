import { Platform } from 'react-native';

let supabaseNative;
let getSupabaseClientWeb

if (Platform.OS === 'web') {
  getSupabaseClientWeb = require('./client.web').getSupabaseClient;
} else {
  supabaseNative = require('./client.native').supabase;
}

export const supabase = supabaseNative;
export { getSupabaseClientWeb as getSupabaseClient };
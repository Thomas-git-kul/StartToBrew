import { Platform } from 'react-native';

let supabase: any;

if (Platform.OS === 'web') {
  const { getSupabaseClient } = require('./client.web');
  supabase = getSupabaseClient(); // call the function to get the client
} else {
  supabase = require('./client.native').supabase;
}

export { supabase };
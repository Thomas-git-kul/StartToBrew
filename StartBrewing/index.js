// Global polyfills first (needed for Supabase in RN)
import 'expo-sqlite/localStorage/install';
import 'react-native-url-polyfill/auto';

// Then hand control to Expo Router
import 'expo-router/entry';

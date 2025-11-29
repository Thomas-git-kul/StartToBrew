// utils/envDiagnostics.ts
// Small runtime diagnostics to log presence of important client env vars.

const vars = {
  // EmailJS
  EXPO_PUBLIC_EMAILJS_SERVICE_ID: !!process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
  EXPO_PUBLIC_EMAILJS_TEMPLATE_ID: !!process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
  EXPO_PUBLIC_EMAILJS_PUBLIC_KEY: !!process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,

  // Stripe
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,

  // Supabase (used by web client)
  EXPO_PUBLIC_SUPABASE_URL: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

  // Firebase (client keys; project may also have NEXT_PUBLIC variants)
  EXPO_PUBLIC_FIREBASE_API_KEY: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: !!process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: !!process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

try {
  // Log compactly so it shows up in browser console or build logs.
  // Do NOT log secret values — only presence booleans.
  // eslint-disable-next-line no-console
  console.log('Env diagnostics:', vars);
} catch (e) {
  // ignore
}

export default vars;

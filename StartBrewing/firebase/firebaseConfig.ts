// firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
 
// Diagnostic: confirm the expected Firebase env keys are available (logs presence only)
const _gotFirebaseApiKey = !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const _gotFirebaseAuthDomain = !!process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const _gotFirebaseProjectId = !!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
console.log('Firebase env keys present:', {
  apiKey: _gotFirebaseApiKey,
  authDomain: _gotFirebaseAuthDomain,
  projectId: _gotFirebaseProjectId,
});
// Initialize Firebase
const app = initializeApp(firebaseConfig);

let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, logEvent };


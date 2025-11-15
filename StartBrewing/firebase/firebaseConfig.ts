// firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Analytics } from "firebase/analytics";
import { logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Analytics (but only in supported environments)
let analytics: Analytics | null = null;

// Debug: Log Firebase config and analytics status
console.log("Firebase Config:", firebaseConfig);
console.log("Analytics initialized:", analytics !== null);

isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log("Analytics enabled");

    // Example: track page view
    logEvent(analytics, "page_view", { page: "HomePage" });
  } else {
    console.log("Analytics not supported in this environment");
  }
});

const getAnalyticsInstance = (): Analytics | null => {
  return analytics;
};

export { app, getAnalyticsInstance };
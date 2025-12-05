// firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCmXZuQ6kcicrEnWGEWwu-HZXmdJRrsJjM",
  authDomain: "starttobrew-e80e7.firebaseapp.com",
  projectId: "starttobrew-e80e7",
  storageBucket: "starttobrew-e80e7.firebasestorage.app",
  messagingSenderId: "53479134584",
  appId: "1:53479134584:web:46531676e29bcc79d9248d",
  measurementId: "G-MV1WL2H58C"
};
 
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

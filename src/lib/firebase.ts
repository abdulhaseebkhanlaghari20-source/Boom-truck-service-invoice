import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Exact Firebase project configuration for boom-truck-invoice
 */
export const firebaseConfig = {
  apiKey: "AIzaSyCpEyo1H_cmmCT8QSxqqOec0lBbI5fUns",
  authDomain: "boom-truck-invoice.firebaseapp.com",
  projectId: "boom-truck-invoice",
  storageBucket: "boom-truck-invoice.firebasestorage.app",
  messagingSenderId: "118817051640",
  appId: "1:118817051640:web:eb0a6d8ca2be7c9fd6fc0d",
  measurementId: "G-890BVJ4LF1"
};

/**
 * Initialize Firebase application singleton
 */
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Firebase Authentication instance configured for Email/Password
 */
export const auth: Auth = getAuth(app);

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Read Firebase client configuration strictly from process.env.NEXT_PUBLIC_FIREBASE_*
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Determines if actual, valid Firebase credentials have been configured
export const isFirebaseConfigured = Boolean(
  projectId &&
  projectId.trim().length > 0 &&
  projectId !== "your-project-id" &&
  projectId !== "tesa-sggsiet" &&
  apiKey &&
  apiKey !== "AIzaSyYourApiKeyHere"
);

// Firebase configuration pulling strictly from process.env.NEXT_PUBLIC_FIREBASE_*
const firebaseConfig = {
  apiKey: apiKey || "",
  authDomain: authDomain || (projectId ? `${projectId}.firebaseapp.com` : ""),
  projectId: projectId || "",
  storageBucket: storageBucket || (projectId ? `${projectId}.firebasestorage.app` : ""),
  messagingSenderId: messagingSenderId || "",
  appId: appId || "",
  measurementId: measurementId || "",
};

// Initialize Firebase App (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Cloud Firestore
const db = getFirestore(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app, auth, googleProvider, db, firebaseConfig };
export default app;


import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbNgYy_EOGsr35-OrdgMsTafdncZW_xKQ",
  authDomain: "tesa-1eaa1.firebaseapp.com",
  projectId: "tesa-1eaa1",
  storageBucket: "tesa-1eaa1.firebasestorage.app",
  messagingSenderId: "666603902117",
  appId: "1:666603902117:web:79ab9bf3baa4f9b23fe94c",
  measurementId: "G-BQRSZB3QXZ"
};

console.log("API Key Status:", firebaseConfig.apiKey ? "LOADED" : "FAILED - MISSING");

// Determines if actual, valid Firebase credentials have been configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim().length > 0 &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim().length > 0
);

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

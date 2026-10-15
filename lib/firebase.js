import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase client configuration using environment variables with safe fallbacks
const firebaseConfig = {
  apiKey: "AIzaSyBuiVujEgq0DmgAMTOMyYkyqwBjQwJ9F78",
  authDomain: "tesa-62f59.firebaseapp.com",
  projectId: "tesa-62f59",
  storageBucket: "tesa-62f59.firebasestorage.app",
  messagingSenderId: "796262565730",
  appId: "1:796262565730:web:d907e616621d868e408e3b",
  measurementId: "G-FM06Y0H7DD"
};

// Initialize Firebase App (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Cloud Firestore & Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app, auth, googleProvider, db, storage };
export default app;


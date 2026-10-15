import admin from "firebase-admin";

// Server-side Firebase Admin SDK initialization (Singleton pattern)
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tesa-sggsiet",
      });
    }
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export default admin;

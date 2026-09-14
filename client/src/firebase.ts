import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "learn-at---manus.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "learn-at---manus",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "learn-at---manus.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "655436723643",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:655436723643:web:868c62cd300f16755d809e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JH40DQ8TNJ",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

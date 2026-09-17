import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

export const getSavedApiKey = () => {
  return localStorage.getItem('vite_firebase_api_key') || import.meta.env.VITE_FIREBASE_API_KEY || "";
};

export const saveApiKey = (key) => {
  if (key && key.trim()) {
    localStorage.setItem('vite_firebase_api_key', key.trim());
  }
};

const createFirebaseServices = () => {
  const apiKey = getSavedApiKey() || import.meta.env.VITE_FIREBASE_API_KEY || "";

  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "knowledge-piolet.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://knowledge-piolet-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "knowledge-piolet",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "knowledge-piolet.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
  };

  const existingApps = getApps();
  let app;
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(firebaseConfig);
  }

  const auth = getAuth(app);
  const rtdb = getDatabase(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  return { app, auth, rtdb, googleProvider };
};

const services = createFirebaseServices();

export const app = services.app;
export const auth = services.auth;
export const rtdb = services.rtdb;
export const googleProvider = services.googleProvider;

export const reinitializeFirebase = (newApiKey) => {
  saveApiKey(newApiKey);
  window.location.reload();
};

export default app;


import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "./firebase";

export const startGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (error: any) {
    console.error("[Firebase Auth] Google Sign-in error:", error);
    if (error.code === 'auth/popup-blocked') {
      alert("Popup blocked by browser. Please allow popups for this site to sign in.");
    }
    throw error;
  }
};

export const startLogin = startGoogleLogin;

export const signInWithEmail = async (email: string, pass: string) => {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return res.user;
};

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && res.user) {
    await updateProfile(res.user, { displayName: name });
  }
  return res.user;
};

export const setupRecaptcha = (containerId: string) => {
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
  }
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });
  (window as any).recaptchaVerifier = verifier;
  return verifier;
};

export const sendPhoneOTP = async (phone: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, phone, verifier);
};

export const logoutUser = async () => {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem("activeRole");
  } catch (error) {
    console.error("[Firebase Auth] Sign-out error:", error);
  }
};


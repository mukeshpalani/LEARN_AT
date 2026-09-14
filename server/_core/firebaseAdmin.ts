import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth as _getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore as _getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage as _getStorage, type Storage } from "firebase-admin/storage";

const projectId = process.env.FIREBASE_PROJECT_ID || "learn-at---manus";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: Storage | null = null;

const hasCredentials = Boolean(clientEmail && privateKey);

if (hasCredentials && !getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail: clientEmail!,
        privateKey: privateKey!,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
    });
  } catch (e) {
    console.warn("[Firebase Admin] App initialization warning:", (e as Error).message);
  }
}

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop: keyof Auth) {
    if (hasCredentials && getApps().length && !_auth) {
      try {
        _auth = _getAuth();
      } catch {}
    }
    if (!_auth) {
      if (prop === "verifyIdToken") {
        return async () => {
          throw new Error("Local dev mode: token verification skipped");
        };
      }
    }
    const val = _auth ? _auth[prop] : undefined;
    return typeof val === "function" ? val.bind(_auth) : val;
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop: keyof Firestore) {
    if (hasCredentials && getApps().length && !_db) {
      try {
        _db = _getFirestore();
      } catch {}
    }
    if (!_db) {
      if (prop === "collection") {
        return () => new Proxy({}, {
          get(_t, innerProp) {
            if (innerProp === "doc" || innerProp === "where" || innerProp === "limit" || innerProp === "add") {
              return () => new Proxy({}, {
                get(_t2, p2) {
                  if (p2 === "get") return async () => ({ empty: true, docs: [] });
                  if (p2 === "set" || p2 === "update" || p2 === "add") return async () => ({ id: "mock-id" });
                  return () => ({ get: async () => ({ empty: true, docs: [] }) });
                }
              });
            }
            return () => ({});
          }
        });
      }
      if (prop === "batch") {
        return () => ({
          set() {},
          update() {},
          commit: async () => {},
        });
      }
    }
    const val = _db ? _db[prop] : undefined;
    return typeof val === "function" ? val.bind(_db) : val;
  },
});

export const adminStorage = new Proxy({} as Storage, {
  get(_target, prop: keyof Storage) {
    if (hasCredentials && getApps().length && !_storage) {
      try {
        _storage = _getStorage();
      } catch {}
    }
    const val = _storage ? _storage[prop] : undefined;
    return typeof val === "function" ? val.bind(_storage) : val;
  },
});

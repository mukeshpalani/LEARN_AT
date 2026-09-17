import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { ref, set, serverTimestamp } from 'firebase/database';
import { auth, googleProvider, rtdb } from '../services/firebase';
import { verifyGmailTokenScope } from '../services/gmailService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gmailAccessToken, setGmailAccessToken] = useState(() => {
    return sessionStorage.getItem('gmail_access_token') || null;
  });
  // States: 'NOT_CONNECTED', 'VERIFYING', 'CONNECTED', 'PERMISSION_REQUIRED', 'TOKEN_EXPIRED', 'ERROR'
  const [gmailStatus, setGmailStatus] = useState('VERIFYING');
  const [authError, setAuthError] = useState(null);

  const verifyTokenState = useCallback(async (token) => {
    if (!token) {
      setGmailStatus('NOT_CONNECTED');
      setGmailAccessToken(null);
      sessionStorage.removeItem('gmail_access_token');
      return false;
    }

    setGmailStatus('VERIFYING');
    const verification = await verifyGmailTokenScope(token);

    if (verification.valid && verification.hasSendScope) {
      setGmailAccessToken(token);
      sessionStorage.setItem('gmail_access_token', token);
      setGmailStatus('CONNECTED');
      return true;
    } else if (verification.valid && !verification.hasSendScope) {
      setGmailAccessToken(token);
      sessionStorage.setItem('gmail_access_token', token);
      setGmailStatus('PERMISSION_REQUIRED');
      return false;
    } else {
      setGmailAccessToken(null);
      sessionStorage.removeItem('gmail_access_token');
      setGmailStatus('TOKEN_EXPIRED');
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync user profile to Firebase Realtime Database
        try {
          const userRef = ref(rtdb, `users/${currentUser.uid}`);
          set(userRef, {
            name: currentUser.displayName || 'Anonymous User',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            lastLogin: serverTimestamp()
          }).catch((err) => console.warn('RTDB sync notice:', err));
        } catch (e) {
          console.warn('RTDB initialization notice:', e);
        }

        const storedToken = sessionStorage.getItem('gmail_access_token');
        if (storedToken) {
          await verifyTokenState(storedToken);
        } else {
          setGmailStatus('NOT_CONNECTED');
        }
      } else {
        setGmailAccessToken(null);
        sessionStorage.removeItem('gmail_access_token');
        setGmailStatus('NOT_CONNECTED');
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase Auth state error:', error);
      setAuthError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [verifyTokenState]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;

      const loggedInUser = result.user;

      if (token) {
        await verifyTokenState(token);
      } else {
        setGmailStatus('NOT_CONNECTED');
      }

      // Sync user info to RTDB
      try {
        const userRef = ref(rtdb, `users/${loggedInUser.uid}`);
        await set(userRef, {
          name: loggedInUser.displayName || 'Anonymous User',
          email: loggedInUser.email || '',
          photoURL: loggedInUser.photoURL || '',
          lastLogin: serverTimestamp()
        });
      } catch (err) {
        console.warn('RTDB user save notice:', err);
      }

      return loggedInUser;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setAuthError(error.message || 'Google Sign-In failed');
      throw error;
    }
  };

  const connectGmail = async (forceConsent = true) => {
    setAuthError(null);
    setGmailStatus('VERIFYING');
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      
      if (forceConsent) {
        provider.setCustomParameters({
          prompt: 'consent',
          access_type: 'offline'
        });
      } else {
        provider.setCustomParameters({
          prompt: 'select_account'
        });
      }

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;

      if (token) {
        const isVerified = await verifyTokenState(token);
        if (isVerified) {
          return true;
        } else {
          throw new Error('Gmail permission (gmail.send) was not granted by the user. Please try again and check the permission box.');
        }
      } else {
        setGmailStatus('ERROR');
        throw new Error('No Gmail access token returned from Google authorization.');
      }
    } catch (error) {
      console.error('Connect Gmail Error:', error);
      if (gmailStatus !== 'PERMISSION_REQUIRED') {
        setGmailStatus('ERROR');
      }
      setAuthError(error.message || 'Failed to authorize Gmail access.');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      setGmailAccessToken(null);
      sessionStorage.removeItem('gmail_access_token');
      setGmailStatus('NOT_CONNECTED');
    }
  };

  const value = {
    user,
    loading,
    gmailAccessToken,
    gmailStatus,
    gmailConnected: gmailStatus === 'CONNECTED',
    gmailScopeMissing: gmailStatus === 'PERMISSION_REQUIRED',
    authError,
    loginWithGoogle,
    connectGmail,
    setGmailStatus,
    verifyTokenState,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;



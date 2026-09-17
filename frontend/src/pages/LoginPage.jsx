import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, Sparkles, ShieldCheck, Mail, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const { loginWithGoogle, authError } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleGoogleLogin = async () => {
    setLoggingIn(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Google Authentication failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 70%)',
      color: '#f8fafc',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '44px 36px',
        borderRadius: '24px',
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.2)',
        textAlign: 'center'
      }}>
        {/* Brand Header */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
        }}>
          <Bot size={36} color="#ffffff" />
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px', letterSpacing: '-0.02em' }}>
          KnowledgePilot
        </h1>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#38bdf8',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '20px'
        }}>
          AI Task Workspace
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '28px' }}>
          Autonomous RAG Task Workspace equipped with RAG Search, Data Analysis, and Real Gmail API Action.
        </p>

        {/* Feature Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '28px',
          textAlign: 'left'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: '#cbd5e1'
          }}>
            <Sparkles size={16} color="#38bdf8" /> RAG Search & Analysis
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: '#cbd5e1'
          }}>
            <Mail size={16} color="#c084fc" /> Real Gmail Sending
          </div>
        </div>

        {/* Auth Error Display */}
        {(errorMsg || authError) && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg || authError}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loggingIn}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ffffff, #f1f5f9)',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '0.98rem',
            border: 'none',
            cursor: loggingIn ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)',
            transition: 'transform 0.2s ease'
          }}
        >
          {loggingIn ? (
            <>
              <Loader2 size={20} className="animate-spin" color="#0f172a" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight size={18} color="#0f172a" style={{ marginLeft: 'auto' }} />
            </>
          )}
        </button>

        {/* OAuth Testing Mode Help Banner */}
        <div style={{
          marginTop: '20px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          color: '#94a3b8',
          fontSize: '0.78rem',
          textAlign: 'left',
          lineHeight: 1.5
        }}>
          <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>ℹ️ OAuth Development / Testing Mode Notice:</span>
          </div>
          If Google displays <em>"Google hasn't verified this app"</em>, click <strong>Advanced</strong> and select <strong>Go to KnowledgePilot (unsafe)</strong> to complete sign-in. Ensure your email is listed under <em>Test users</em> in GCP Console.
        </div>

        {/* Security Note */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#34d399',
          fontSize: '0.78rem',
          fontWeight: 600
        }}>
          <ShieldCheck size={14} color="#34d399" />
          <span>Secure Firebase Authentication • Google Sign-In</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;



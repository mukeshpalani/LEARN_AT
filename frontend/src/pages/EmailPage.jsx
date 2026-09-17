import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendRealGmailMessage } from '../services/gmailService';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { Mail, CheckCircle, AlertTriangle, Send, Loader2, RefreshCw, Sparkles, Inbox, Clock, UserCheck } from 'lucide-react';

const EmailPage = () => {
  const { user, gmailStatus, gmailConnected, gmailScopeMissing, gmailAccessToken, connectGmail, setGmailStatus } = useAuth();

  // Form State
  const [recipient, setRecipient] = useState('example@gmail.com');
  const [subject, setSubject] = useState('Project Showcase Acceptance');
  const [body, setBody] = useState(`Dear Organizer,\n\nThank you for inviting me to the upcoming project showcase. I am pleased to accept the invitation and look forward to participating in the event.\n\nBest regards,\n${user?.displayName || 'Mukesh'}`);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Status State
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState(null);
  const [sendError, setSendError] = useState(null);

  // History state from Firebase Realtime Database
  const [sentHistory, setSentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoadingHistory(false);
      return;
    }

    try {
      const historyRef = ref(rtdb, `email_tasks/${user.uid}`);
      const unsubscribe = onValue(historyRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.keys(data).map((key) => ({
            id: key,
            ...data[key]
          })).sort((a, b) => new Date(b.sentAt || 0) - new Date(a.sentAt || 0));
          setSentHistory(list);
        } else {
          setSentHistory([]);
        }
        setLoadingHistory(false);
      }, (err) => {
        console.warn('RTDB history read notice:', err);
        setLoadingHistory(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('RTDB setup notice:', e);
      setLoadingHistory(false);
    }
  }, [user]);

  const handleGenerateAiDraft = () => {
    if (!aiPrompt.trim()) return;
    setSubject(`Re: ${aiPrompt.slice(0, 30)}`);
    setBody(`Dear Sir/Madam,\n\nIn response to your inquiry regarding "${aiPrompt}":\n\nI am pleased to confirm that I accept the proposal and will proceed as requested. Please let me know if any further details are required.\n\nBest regards,\n${user?.displayName || 'Mukesh'}`);
    setSentResult(null);
    setSendError(null);
  };

  const handleSendEmail = async (e) => {
    e?.preventDefault();
    if (!gmailConnected || !gmailAccessToken) {
      setSendError('Gmail send permission is missing. Please click "Reconnect Gmail" and allow permission to send emails.');
      if (gmailStatus === 'CONNECTED') setGmailStatus('PERMISSION_REQUIRED');
      return;
    }

    if (!recipient || !recipient.trim()) {
      setSendError('Please enter a valid recipient email address.');
      return;
    }

    setSending(true);
    setSendError(null);
    setSentResult(null);

    try {
      const res = await sendRealGmailMessage({
        to: recipient.trim(),
        subject: subject,
        body: body,
        fromEmail: user?.email || 'user@gmail.com',
        accessToken: gmailAccessToken,
        userUid: user?.uid,
        taskId: `email_manual_${Date.now()}`
      });

      setSentResult(res);
    } catch (err) {
      console.error('Real Gmail API send error:', err);
      if (err.code === 'INSUFFICIENT_SCOPES') {
        setGmailStatus('PERMISSION_REQUIRED');
      } else if (err.code === 'TOKEN_EXPIRED') {
        setGmailStatus('TOKEN_EXPIRED');
      }
      setSendError(err.message || 'Gmail API send request failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header & Connection Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={26} color="#38bdf8" />
            <span>Gmail Workspace & Email Tool</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
            Direct Gmail REST API Integration • Authorized as <strong>{user?.email || 'Authenticated User'}</strong>
          </p>
        </div>

        {/* Connection Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '14px',
          background: gmailConnected 
            ? 'rgba(52, 211, 153, 0.12)' 
            : gmailScopeMissing || gmailStatus === 'TOKEN_EXPIRED'
              ? 'rgba(245, 158, 11, 0.15)'
              : 'rgba(148, 163, 184, 0.12)',
          border: gmailConnected 
            ? '1px solid #34d399' 
            : gmailScopeMissing || gmailStatus === 'TOKEN_EXPIRED'
              ? '1px solid #f59e0b'
              : '1px solid #64748b',
          color: gmailConnected 
            ? '#34d399' 
            : gmailScopeMissing || gmailStatus === 'TOKEN_EXPIRED'
              ? '#fbbf24'
              : '#94a3b8'
        }}>
          <Mail size={18} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {gmailConnected 
              ? '✓ Gmail Connected' 
              : gmailScopeMissing 
                ? '⚠️ Permission Required' 
                : gmailStatus === 'TOKEN_EXPIRED'
                  ? '⚠️ Token Expired'
                  : gmailStatus === 'VERIFYING'
                    ? '⏳ Verifying...'
                    : '○ Gmail Disconnected'}
          </div>
          {!gmailConnected ? (
            <button
              onClick={() => connectGmail(true)}
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                background: '#f59e0b',
                color: '#0f172a',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem'
              }}
            >
              {gmailScopeMissing || gmailStatus === 'TOKEN_EXPIRED' ? 'Reconnect Gmail' : 'Connect Gmail'}
            </button>
          ) : (
            <button
              onClick={() => connectGmail(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reauthorize
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Composer on Left, History on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        {/* Email Composer & AI Assistant */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#c084fc" /> AI Email Composer & Dispatch
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Direct Gmail Dispatch</span>
          </div>

          {/* Quick Prompt Assist */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe email intent (e.g., 'Accept project showcase invitation')..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#020617',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
            <button
              onClick={handleGenerateAiDraft}
              disabled={!aiPrompt.trim()}
              className="glass-button-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            >
              Auto-Draft
            </button>
          </div>

          {/* Connection / Permission Alert Banner */}
          {!gmailConnected && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid #f59e0b',
              color: '#fbbf24',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} />
                  <span>
                    {gmailScopeMissing 
                      ? <span>Gmail <strong>gmail.send</strong> permission is missing. Please re-authorize and check the permission box to enable sending.</span>
                      : <span>Gmail authorization required. Connect Gmail to send emails directly from <strong>{user?.email || 'your address'}</strong>.</span>
                    }
                  </span>
                </div>
                <button
                  onClick={() => connectGmail(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: '#f59e0b',
                    color: '#0f172a',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {gmailScopeMissing ? 'Reconnect Gmail' : 'Connect Gmail'}
                </button>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', paddingTop: '4px', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                ℹ️ <strong>OAuth Re-Consent:</strong> Click <strong>{gmailScopeMissing ? 'Reconnect Gmail' : 'Connect Gmail'}</strong> to grant the mandatory <code>gmail.send</code> permission on Google's consent screen.
              </div>
            </div>
          )}

          {/* Real API Success Confirmation */}
          {sentResult && (
            <div style={{
              padding: '16px 18px',
              borderRadius: '14px',
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid #34d399',
              color: '#34d399',
              fontSize: '0.88rem'
            }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle size={20} /> Real Email Sent Successfully via Gmail API!
              </div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <div><strong>From:</strong> {user?.email}</div>
                <div><strong>To:</strong> {sentResult.recipient}</div>
                <div><strong>Subject:</strong> {sentResult.subject}</div>
                <div><strong>Gmail Message ID:</strong> <code style={{ color: '#38bdf8' }}>{sentResult.messageId}</code></div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>
                  Confirmed by Gmail REST API at {new Date(sentResult.sentAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Real API Failure Alert */}
          {sendError && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ wordBreak: 'break-word', flex: 1 }}>❌ {sendError}</div>
                <button
                  onClick={() => connectGmail(true)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <RefreshCw size={12} style={{ display: 'inline', marginRight: '4px' }} /> Reconnect Gmail
                </button>
              </div>
              {(sendError.includes('gmail.googleapis.com') || sendError.includes('disabled') || sendError.includes('has not been used')) && (
                <a
                  href="https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=669978345354"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#38bdf8',
                    textDecoration: 'underline',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    marginTop: '6px'
                  }}
                >
                  👉 Enable Gmail API in Google Cloud Console (Project 669978345354)
                </a>
              )}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                From (Authenticated Sender):
              </label>
              <input
                type="text"
                value={user?.email || 'user@gmail.com'}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#38bdf8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                To (Recipient Email Address):
              </label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#020617',
                  border: '1px solid #38bdf8',
                  color: '#fff',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Subject:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#020617',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Email Body:
              </label>
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#020617',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                🔒 Sends directly via Gmail REST API
              </span>

              <button
                type="submit"
                disabled={sending || !gmailConnected}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: sending || !gmailConnected ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontWeight: 700,
                  border: 'none',
                  cursor: sending || !gmailConnected ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.92rem',
                  boxShadow: gmailConnected ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {sending ? 'Sending through Gmail...' : 'Send Email'}
              </button>
            </div>
          </form>
        </div>

        {/* Sent Email Log Feed from Firebase RTDB */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Inbox size={18} color="#34d399" /> Realtime Sent Email Activity
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Firebase Database</span>
          </div>

          {loadingHistory ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading sent email records...</div>
            </div>
          ) : sentHistory.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
              No sent emails logged yet. When you authorize Gmail and send emails, real transaction logs will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
              {sentHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.84rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>To: {item.recipient}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>✓ Delivered</span>
                  </div>
                  <div style={{ color: '#38bdf8', fontWeight: 500, marginBottom: '6px' }}>{item.subject}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.body}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.72rem', marginTop: '8px' }}>
                    <span><Clock size={12} style={{ display: 'inline', marginRight: '3px' }} /> {new Date(item.sentAt).toLocaleString()}</span>
                    {item.messageId && <span>ID: <code>{item.messageId.slice(0, 12)}...</code></span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPage;

import { ref, set } from 'firebase/database';
import { rtdb } from './firebase';

export const createMimeMessage = (to, subject, body, fromEmail) => {
  const dateStr = new Date().toUTCString();
  const emailLines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${dateStr}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    'MIME-Version: 1.0',
    '',
    body
  ];
  return emailLines.join('\r\n');
};

const base64UrlEncode = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Verifies if the provided Google access token is valid and contains the gmail.send scope.
 * Uses Google's official tokeninfo API.
 */
export const verifyGmailTokenScope = async (accessToken) => {
  if (!accessToken) return { valid: false, hasSendScope: false };

  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    if (!response.ok) {
      console.warn('Gmail tokeninfo check returned status:', response.status);
      return { valid: false, hasSendScope: false };
    }

    const tokenInfo = await response.json();
    const scopes = (tokenInfo.scope || '').split(' ');
    const requiredScope = 'https://www.googleapis.com/auth/gmail.send';
    const fullMailScope = 'https://mail.google.com/';

    const hasSendScope = scopes.includes(requiredScope) || scopes.includes(fullMailScope);

    // Safe diagnostic output without exposing token strings
    console.log('Gmail authorization check:', {
      authenticated: true,
      gmailSendScope: hasSendScope,
      tokenValid: true,
      expiresInSeconds: tokenInfo.expires_in
    });

    return {
      valid: true,
      hasSendScope,
      scopes,
      expiresIn: tokenInfo.expires_in
    };
  } catch (err) {
    console.error('Error verifying Gmail token scope:', err);
    return { valid: false, hasSendScope: false, error: err.message };
  }
};

export const sendRealGmailMessage = async ({ to, subject, body, fromEmail, accessToken, userUid, taskId }) => {
  if (!to || !to.trim()) {
    throw new Error('Recipient email address is missing. Please enter a valid recipient email.');
  }

  if (!accessToken) {
    const err = new Error('Gmail authorization missing. Please connect your Gmail account with sending permissions.');
    err.code = 'NOT_CONNECTED';
    throw err;
  }

  const mimeString = createMimeMessage(to, subject, body, fromEmail);
  const rawBase64 = base64UrlEncode(mimeString);

  // Send real Gmail API request
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: rawBase64 })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `Gmail API HTTP ${response.status}: ${response.statusText}`;
    console.error('Gmail API send error detail:', errorData);

    if (response.status === 403 && (errorMessage.toLowerCase().includes('insufficient') || errorMessage.toLowerCase().includes('scope'))) {
      const err = new Error('Gmail permission is missing. Please click "Reconnect Gmail" and grant permission to send emails.');
      err.code = 'INSUFFICIENT_SCOPES';
      throw err;
    }

    if (response.status === 401) {
      const err = new Error('Gmail token expired or invalid. Please reconnect your Gmail account.');
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }

    throw new Error(`Email could not be sent. ${errorMessage}`);
  }

  const data = await response.json();
  const sentTime = new Date().toISOString();
  const realMessageId = data.id;

  // Persist to Firebase Realtime Database
  if (userUid) {
    try {
      const recordId = taskId || `email_${Date.now()}`;
      const taskRef = ref(rtdb, `email_tasks/${userUid}/${recordId}`);
      await set(taskRef, {
        recipient: to,
        subject: subject,
        body: body,
        fromEmail: fromEmail,
        status: 'sent',
        sentAt: sentTime,
        messageId: realMessageId
      });
    } catch (dbErr) {
      console.warn('Firebase RTDB email log notice:', dbErr);
    }
  }

  return {
    status: 'sent',
    messageId: realMessageId,
    sentAt: sentTime,
    recipient: to,
    subject: subject,
    message: `Email successfully sent via Gmail API! Message ID: ${realMessageId}`
  };
};



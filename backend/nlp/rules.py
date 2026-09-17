import re
from typing import Dict, Any, Optional
from backend.nlp.taxonomy import ActionType, MessagePurpose


class DeterministicRules:
    """Layer A — Lightweight deterministic rules for fast, highly reliable signals."""

    @staticmethod
    def analyze(query: str) -> Dict[str, Any]:
        q_norm = query.lower().replace('-', ' ').strip()
        q_raw = query.lower().strip()

        # Email regex pattern
        email_matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', query)
        recipient_email = email_matches[0] if email_matches else None

        # 1. Action detection rules
        send_phrases = [
            "send this to", "sent this to", "send email to", "sent email to", "send an email to", "sent an email to",
            "send to", "sent to", "mail to", "mailed to", "email to", "emailed to", "send a reply", "sent a reply",
            "send reply", "sent reply", "send accepted", "send accepting", "send it to", "sent it to",
            "send the following message", "sent the following message", "forward to", "forwarded to", "forward this to",
            "send mail", "send message", "deliver to"
        ]
        draft_phrases = [
            "draft an email", "draft a reply", "write an email", "write a reply", "help me write",
            "create an email", "prepare an email", "compose an email", "draft email", "write email",
            "create dummy mail", "create mail", "make an email", "generate email", "write a mail"
        ]
        read_summary_phrases = [
            "summarize", "summary", "read email", "explain email", "find email", "search email",
            "check my inbox", "show emails"
        ]

        detected_action = ActionType.NON_EMAIL_TASK
        action_confidence = 0.0

        is_explicit_draft = any(p in q_norm for p in draft_phrases) or q_norm.startswith("write ") or q_norm.startswith("draft ") or q_norm.startswith("compose ")
        is_explicit_send = any(p in q_norm for p in send_phrases) or (recipient_email and any(w in q_norm for w in ["send", "sent", "forward"]))

        if is_explicit_draft and not (any(p in q_norm for p in ["send this", "send it", "send draft"]) or (recipient_email and "send " in q_norm)):
            detected_action = ActionType.DRAFT_EMAIL
            action_confidence = 0.95
        elif is_explicit_send or (recipient_email and "send" in q_norm):
            detected_action = ActionType.SEND_EMAIL
            action_confidence = 0.95
        elif any(p in q_norm for p in read_summary_phrases):
            if "summarize" in q_norm or "summary" in q_norm:
                detected_action = ActionType.SUMMARIZE_EMAIL
            else:
                detected_action = ActionType.READ_EMAIL
            action_confidence = 0.85

        # 2. Purpose detection rules
        purpose_signal = MessagePurpose.OTHER
        purpose_confidence = 0.0

        if any(p in q_norm for p in ["love proposal", "proposal of love", "express my feelings", "express feelings", "marry me", "romantic proposal", "i love you", "tell them i love", "confess my love"]):
            purpose_signal = MessagePurpose.ROMANTIC_PROPOSAL
            purpose_confidence = 0.95
        elif any(p in q_norm for p in ["business proposal", "commercial proposal", "partnership proposal", "sales proposal", "business pitch"]):
            purpose_signal = MessagePurpose.BUSINESS_PROPOSAL
            purpose_confidence = 0.95
        elif any(p in q_norm for p in ["event proposal", "showcase proposal", "workshop proposal"]):
            purpose_signal = MessagePurpose.EVENT_PROPOSAL
            purpose_confidence = 0.95
        elif any(p in q_norm for p in ["dummy mail", "dummy email", "test mail", "test email", "sample mail", "sample email"]):
            purpose_signal = MessagePurpose.GENERIC_EMAIL
            purpose_confidence = 0.95
        elif any(p in q_norm for p in ["thank you", "thank-you", "thanks", "appreciation", "gratitude", "thank"]):
            purpose_signal = MessagePurpose.THANK_YOU
            purpose_confidence = 0.95
        elif any(p in q_norm for p in ["accept invitation", "accepting invitation", "accept the invitation", "accepting the invitation", "accept invite", "i accept", "accept the offer", "project acceptance", "acceptance email", "acceptance"]):
            purpose_signal = MessagePurpose.ACCEPTANCE
            purpose_confidence = 0.95
        elif any(p in q_norm for p in ["reject invitation", "decline invitation", "decline offer", "cannot attend", "regretfully decline"]):
            purpose_signal = MessagePurpose.REJECTION
            purpose_confidence = 0.90
        elif any(p in q_norm for p in ["invitation to", "inviting you", "showcase invitation", "join us for"]):
            purpose_signal = MessagePurpose.INVITATION
            purpose_confidence = 0.85
        elif any(p in q_norm for p in ["apologize", "apology", "sorry for", "regret to inform"]):
            purpose_signal = MessagePurpose.APOLOGY
            purpose_confidence = 0.90
        elif any(p in q_norm for p in ["follow up", "following up", "status update", "check in"]):
            purpose_signal = MessagePurpose.FOLLOW_UP
            purpose_confidence = 0.85
        elif any(p in q_norm for p in ["reminder", "remind", "dont forget"]):
            purpose_signal = MessagePurpose.REMINDER
            purpose_confidence = 0.85

        return {
            "action_signal": detected_action.value,
            "action_confidence": action_confidence,
            "purpose_signal": purpose_signal.value,
            "purpose_confidence": purpose_confidence,
            "recipient_email": recipient_email
        }

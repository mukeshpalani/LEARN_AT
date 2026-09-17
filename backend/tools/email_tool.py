import logging
import datetime
import base64
import json
import re
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from backend.services.llm_service import LLMService

logger = logging.getLogger(__name__)


def sanitize_email_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'🔒\s*Safety Check:.*?(?=\n|$)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Safety Check:.*?(?=\n|$)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'This email will not be sent until you click.*?(?=\n|$)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'🔒\s*Calls Gmail REST API directly.*?(?=\n|$)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'it still asking me a permission.*?(?=\n|$)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'I have created an email draft based on your request:?', '', text, flags=re.IGNORECASE)
    return text.strip()


class EmailDraftSchema(BaseModel):
    recipient: str = Field(default="recipient@example.com", description="Target recipient email address or recipient name")
    subject: str = Field(default="Response to your email", description="Subject line for the email")
    body: str = Field(description="Full text body of the drafted email response. Do NOT include any safety checks or disclaimers.")
    reasoning: Optional[str] = Field(default="", description="Brief explanation of email intent analysis and response strategy")


class EmailTool:
    @staticmethod
    def draft_email(query: str, context: Optional[str] = None, structured_intent: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Drafts an email based on user query, optional context, and structured intent.
        Supports both Workflow A (reply) and Workflow B (new email composition).
        """
        logger.info(f"Drafting intelligent email for query: '{query}'")
        
        extracted_email = None
        email_matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', f"{query} {context or ''}")
        if email_matches:
            extracted_email = email_matches[0]

        purpose_val = structured_intent.get("message_purpose") if structured_intent else "OTHER"

        prompt = f"""You are KnowledgePilot's Intelligent Email Understanding & Response Agent.
Analyze the user's request and draft an appropriate, highly professional email.

User Request: "{query}"
Detected Message Purpose: {purpose_val}
Retrieved Context / Documents: "{context or 'None'}"

INSTRUCTIONS:
1. WORKFLOW CLASSIFICATION:
   - WORKFLOW A (Reply): If responding to a received email, address all items politely.
   - WORKFLOW B (Compose New): Compose a clear, structured message matching requested purpose.
2. RECIPIENT IDENTIFICATION:
   - Use explicit email address if present ({extracted_email or 'None'}).
3. BODY CONTENT & CONSTRAINTS:
   - Use a polite greeting ('Dear [Name/Team],').
   - For ROMANTIC_PROPOSAL: Write a sincere, heartfelt personal declaration of affection and a proposal of partnership.
   - STRICT CONSTRAINT FOR PERSONAL/ROMANTIC EMAILS: Do NOT invent unrequested personal details (e.g. fake dates, specific place names, fake shared memories, or unstated relationship history).
   - Sign off professionally ('Best regards,\nMukesh').
   - DO NOT include safety checks or approval disclaimers.

Output structured JSON matching:
- recipient: recipient email address or name
- subject: subject line
- body: full formatted email body
- reasoning: brief analysis summary
"""
        result = LLMService.generate_structured(
            prompt=prompt,
            schema_class=EmailDraftSchema,
            system_prompt="You draft clear, polite, courteous emails adhering strictly to user intent without safety disclaimers."
        )

        if not result or "body" not in result:
            result = {
                "recipient": extracted_email or "recipient@example.com",
                "subject": "Regarding your request",
                "body": f"Dear Sir/Madam,\n\nThank you for reaching out regarding: {query}.\n\nBest regards,\nMukesh",
                "reasoning": "Standard professional email draft based on query analysis."
            }

        recipient_val = result.get("recipient", "")
        if extracted_email and (not recipient_val or recipient_val == "recipient@example.com" or "@" not in recipient_val):
            recipient_val = extracted_email
        elif not recipient_val:
            recipient_val = "recipient@example.com"

        clean_body = sanitize_email_text(result.get("body", ""))
        clean_subj = sanitize_email_text(result.get("subject", "Email Response"))
        clean_reason = sanitize_email_text(result.get("reasoning", "Email draft generated based on user instructions."))

        return {
            "recipient": recipient_val,
            "subject": clean_subj,
            "body": clean_body,
            "reasoning": clean_reason,
            "status": "drafted",
            "requires_user_approval": False
        }

    @staticmethod
    def process_email_request(
        query: str,
        context: Optional[str] = None,
        access_token: Optional[str] = None,
        from_email: Optional[str] = None,
        email_action: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        structured_intent: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Processes an email request.
        1. Evaluates hybrid NLP intent & context reuse flags.
        2. Evaluates recipient and content completeness.
        3. Supports multi-turn draft execution safely without cross-task contamination.
        4. Invokes Gmail REST API ONLY if action == 'SEND' and access_token is present.
        """
        q_lower = query.lower().strip()

        if not structured_intent:
            from backend.nlp import HybridNLPEngine
            intent_obj = HybridNLPEngine.process(query, conversation_history=conversation_history)
            structured_intent = intent_obj.to_dict()

        reuse_previous = structured_intent.get("reuse_previous_email", False)

        # Determine action state
        if not email_action:
            action_str = structured_intent.get("action")
            if action_str == "SEND_EMAIL":
                email_action = "SEND"
            elif action_str == "CLARIFY":
                email_action = "CLARIFY"
            else:
                email_action = "DRAFT"

        # Extract recipient
        extracted_recipient = structured_intent.get("recipient")
        if not extracted_recipient:
            email_matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', f"{query} {context or ''}")
            if email_matches:
                extracted_recipient = email_matches[0]
            elif reuse_previous and conversation_history:
                for msg in reversed(conversation_history):
                    hist_matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', msg.get("content", ""))
                    if hist_matches:
                        extracted_recipient = hist_matches[0]
                        break

        # Extract previous draft ONLY if reuse_previous_email is True!
        previous_draft_body = None
        previous_draft_subject = None
        if reuse_previous and conversation_history:
            for msg in reversed(conversation_history):
                content = msg.get("content", "")
                if msg.get("role") == "assistant" and len(content) > 10:
                    body_match = re.search(r'(?:\*\*Message Body:\*\*|Message Body:)\s*\n*(.*?)(?=\n\*|\n###|$)', content, re.DOTALL)
                    if body_match:
                        previous_draft_body = body_match.group(1).strip()
                    
                    subj_match = re.search(r'(?:\*\*Subject:\*\*|Subject:)\s*(.*?)(?=\n|$)', content)
                    if subj_match:
                        previous_draft_subject = subj_match.group(1).strip()
                    
                    if not previous_draft_body:
                        if "Subject:" in content:
                            parts = content.split('\n\n', 1)
                            if len(parts) > 1:
                                previous_draft_body = parts[1].strip()
                            else:
                                previous_draft_body = content.strip()
                        elif any(g in content for g in ["Dear ", "Hi ", "Hello ", "Best regards", "Mukesh"]):
                            previous_draft_body = content.strip()

                    if previous_draft_body:
                        break

        # Evaluate content completeness
        cleaned_query = q_lower
        if extracted_recipient:
            cleaned_query = cleaned_query.replace(extracted_recipient.lower(), "")
        for word in ["send", "sent", "this", "an", "a", "the", "email", "message", "mail", "mailed", "emailed", "to", "it"]:
            cleaned_query = re.sub(rf'\b{word}\b', '', cleaned_query)
        cleaned_alphanumeric = re.sub(r'[^a-z0-9]', '', cleaned_query)
        has_raw_content = len(cleaned_alphanumeric) > 0 or bool(re.search(r'[:"]', query))

        # Check CLARIFY states for SEND action
        if email_action == "SEND":
            if not extracted_recipient and not any(w in q_lower for w in ["hr team", "organizer", "manager", "support", "team"]):
                logger.info("Missing recipient for explicit SEND command. Requesting clarification.")
                return {
                    "status": "clarify",
                    "email_action": "CLARIFY",
                    "missing_field": "recipient",
                    "clarification_prompt": "Who should I send it to?",
                    "requires_user_approval": False
                }

            if not has_raw_content and not previous_draft_body and not context:
                logger.info("Missing email content for explicit SEND command. Requesting clarification.")
                return {
                    "status": "clarify",
                    "email_action": "CLARIFY",
                    "missing_field": "content",
                    "clarification_prompt": "What would you like me to send?",
                    "requires_user_approval": False
                }

        # Draft / generate email content
        if reuse_previous and previous_draft_body and not has_raw_content:
            recipient = extracted_recipient or "recipient@example.com"
            subject = previous_draft_subject or "Response to your email"
            body = previous_draft_body
            reasoning = "Reusing previous active draft as commanded by continuation request."
        else:
            # For new independent tasks, exclude unrelated document context unless query asks for document/file reference
            purpose_val = structured_intent.get("message_purpose")
            is_personal = purpose_val in ["ROMANTIC_PROPOSAL", "PERSONAL", "THANK_YOU", "APOLOGY"]
            effective_context = None if (is_personal or not reuse_previous) else context

            draft = EmailTool.draft_email(query, context=effective_context, structured_intent=structured_intent)
            recipient = extracted_recipient or draft.get("recipient") or "recipient@example.com"
            subject = draft.get("subject") or "Response to your email"
            body = draft.get("body") or ""
            reasoning = draft.get("reasoning", "")

        if email_action == "DRAFT":
            return {
                "status": "drafted",
                "email_action": "DRAFT",
                "recipient": recipient,
                "subject": subject,
                "body": body,
                "reasoning": reasoning,
                "requires_user_approval": False
            }

        # 7. If action == "SEND", execute Gmail REST API send operation
        if email_action == "SEND":
            logger.info(f"Executing explicit SEND command for recipient {recipient}...")
            if not access_token:
                logger.warning("Attempted to send email without valid access_token.")
                return {
                    "status": "failed",
                    "email_action": "SEND",
                    "recipient": recipient,
                    "subject": subject,
                    "body": body,
                    "error": "Gmail authorization required. Please connect your Gmail account to enable automatic email delivery.",
                    "requires_user_approval": False
                }

            try:
                send_res = EmailTool.send_email(
                    recipient=recipient,
                    subject=subject,
                    body=body,
                    from_email=from_email,
                    access_token=access_token
                )
                return {
                    "status": "sent",
                    "email_action": "SEND",
                    "recipient": recipient,
                    "subject": subject,
                    "body": body,
                    "reasoning": reasoning,
                    "sent_at": send_res.get("sent_at"),
                    "message_id": send_res.get("message_id"),
                    "requires_user_approval": False
                }
            except Exception as ex:
                err_msg = str(ex)
                logger.error(f"Gmail REST API dispatch error: {err_msg}")
                return {
                    "status": "failed",
                    "email_action": "SEND",
                    "recipient": recipient,
                    "subject": subject,
                    "body": body,
                    "error": err_msg if "Gmail" in err_msg else f"Gmail authorization does not include the required sending permission ({err_msg}).",
                    "requires_user_approval": False
                }

        return draft

    @staticmethod
    def send_email(recipient: str, subject: str, body: str, from_email: Optional[str] = None, access_token: Optional[str] = None) -> Dict[str, Any]:
        """Sends an email via real Gmail API using access_token."""
        logger.info(f"Processing Gmail REST send request to {recipient} with subject '{subject}'")
        timestamp = datetime.datetime.now().isoformat()

        if not access_token:
            logger.error("Attempted to send email without Gmail access_token.")
            raise ValueError("Gmail authorization required. Please connect your Gmail account before sending.")

        from_hdr = f"From: {from_email}\r\n" if from_email else ""
        mime_str = f"{from_hdr}To: {recipient}\r\nSubject: {subject}\r\nContent-Type: text/plain; charset=utf-8\r\nMIME-Version: 1.0\r\n\r\n{body}"
        
        raw_bytes = mime_str.encode('utf-8')
        b64_str = base64.urlsafe_b64encode(raw_bytes).decode('utf-8').rstrip('=')

        url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        payload = json.dumps({"raw": b64_str}).encode('utf-8')
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                resp_data = json.loads(resp.read().decode('utf-8'))
                msg_id = resp_data.get("id")
                logger.info(f"Gmail API successfully sent message. ID: {msg_id}")
                return {
                    "status": "sent",
                    "recipient": recipient,
                    "subject": subject,
                    "body": body,
                    "sent_at": timestamp,
                    "message_id": msg_id,
                    "message": f"Real Gmail message delivered successfully to {recipient}. (ID: {msg_id})"
                }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            logger.error(f"Gmail API HTTP error {e.code}: {err_body}")
            raise Exception(f"Gmail authorization does not include the required sending permission (HTTP {e.code}).")
        except Exception as ex:
            logger.error(f"Gmail API connection error: {ex}")
            raise Exception(f"Gmail connection failed: {str(ex)}")


import re
from typing import Dict, Any, Optional


class EntityExtractor:
    """Layer B — Entity Extraction module for email & task parameters."""

    @staticmethod
    def extract(query: str) -> Dict[str, Any]:
        q_lower = query.lower().strip()

        # Recipient email
        email_matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', query)
        recipient_email = email_matches[0] if email_matches else None

        # Recipient name / role
        recipient_name = None
        if recipient_email:
            # e.g. depakashok720 -> depakashok
            username_part = recipient_email.split('@')[0]
            name_clean = re.sub(r'\d+', '', username_part).replace('.', ' ').strip().title()
            recipient_name = name_clean if len(name_clean) > 2 else recipient_email
        else:
            name_match = re.search(r'\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b', query)
            if name_match:
                recipient_name = name_match.group(1).strip()

        # Requested content extraction
        requested_content = None
        for keyword in ["love proposal", "thank-you email", "thank you email", "acceptance email", "project invitation", "proposal"]:
            if keyword in q_lower:
                requested_content = keyword
                break

        if not requested_content:
            # Strip action words & email address to find remaining topic
            cleaned = q_lower
            if recipient_email:
                cleaned = cleaned.replace(recipient_email.lower(), "")
            for word in ["send", "sent", "this", "an", "a", "the", "email", "message", "mail", "to", "draft", "write"]:
                cleaned = re.sub(rf'\b{word}\b', '', cleaned)
            cleaned = cleaned.strip()
            if len(cleaned) > 2:
                requested_content = cleaned

        return {
            "recipient": recipient_email or recipient_name,
            "recipient_email": recipient_email,
            "recipient_name": recipient_name,
            "requested_content": requested_content,
            "has_email_address": bool(recipient_email)
        }

import logging
from typing import Dict, Any, Optional
from backend.tools.email_tool import EmailTool

logger = logging.getLogger(__name__)


class EmailAgent:
    @staticmethod
    def run(
        query: str,
        retrieved_context: Optional[list] = None,
        access_token: Optional[str] = None,
        from_email: Optional[str] = None,
        email_action: Optional[str] = None,
        conversation_history: Optional[list] = None,
        structured_intent: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Runs the Email Agent to process email request with SEND/DRAFT/CLARIFY state handling."""
        logger.info(f"EmailAgent running for query: '{query}' with action: '{email_action}'")
        
        context_str = ""
        if retrieved_context:
            context_str = "\n".join([c.get("evidence") or c.get("content") or "" for c in retrieved_context[:3]])

        result = EmailTool.process_email_request(
            query=query,
            context=context_str,
            access_token=access_token,
            from_email=from_email,
            email_action=email_action,
            conversation_history=conversation_history,
            structured_intent=structured_intent
        )
        return result


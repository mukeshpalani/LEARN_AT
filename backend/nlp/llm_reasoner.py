import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.services.llm_service import LLMService
from backend.nlp.taxonomy import ActionType, MessagePurpose, ContextDependency

logger = logging.getLogger(__name__)


class LLMReasoningSchema(BaseModel):
    action: ActionType = Field(description="Action type enum: SEND_EMAIL, DRAFT_EMAIL, REPLY_EMAIL, FORWARD_EMAIL, SUMMARIZE_EMAIL, READ_EMAIL, CLARIFY, NON_EMAIL_TASK, etc.")
    message_purpose: MessagePurpose = Field(description="Message purpose enum: PROFESSIONAL, ACADEMIC, PERSONAL, REQUEST, INVITATION, ACCEPTANCE, REJECTION, FOLLOW_UP, APOLOGY, THANK_YOU, REMINDER, ROMANTIC_PROPOSAL, OTHER")
    recipient: Optional[str] = Field(default=None, description="Extracted target email address or recipient name")
    subject: Optional[str] = Field(default=None, description="Suggested subject line")
    requested_content: Optional[str] = Field(default=None, description="Requested email body content description")
    context_dependency: ContextDependency = Field(description="NEW_TASK if request starts a new task; CONTINUATION if it continues previous draft; CORRECTION if modifying previous draft; REFERENCE if referring to past task")
    reuse_previous_email: bool = Field(description="Set to True ONLY if current task directly continues previous email draft. Set to False for NEW_TASK or purpose change.")
    reasoning: str = Field(description="Brief 1-sentence reasoning for the intent classification")
    confidence: float = Field(default=0.9, description="Confidence score from 0.0 to 1.0")


class LLMReasoner:
    """Layer D — LLM Semantic Reasoning Module."""

    @staticmethod
    def reason(
        query: str,
        rule_signals: Dict[str, Any],
        entities: Dict[str, Any],
        semantic_scores: Dict[str, Any],
        conversation_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        prompt = f"""You are the central Hybrid NLP Intent Reasoning engine for KnowledgePilot.
Analyze the user's message alongside pre-extracted signals to determine the exact structured intent.

User Message: "{query}"

Signals collected from deterministic & semantic layers:
- Layer A Rule Signals: {rule_signals}
- Layer B Entities: {entities}
- Layer C Semantic Similarity Top Purpose: {semantic_scores.get('top_purpose')} (score: {semantic_scores.get('top_score')})
- Active Conversation Context: {conversation_context or "No active task context"}

CRITICAL CONTEXT & CONTAMINATION RULES:
1. Distinguish ACTION (e.g. SEND_EMAIL vs DRAFT_EMAIL) from MESSAGE PURPOSE (e.g. ROMANTIC_PROPOSAL vs ACCEPTANCE).
2. If the user asks to send a new type of message (e.g., "send a love proposal to X") while previous conversation was about an unrelated topic (e.g., "Project Showcase Invitation"), this is a NEW_TASK!
3. For a NEW_TASK, reuse_previous_email MUST BE FALSE. Never contaminate a new request with previous unrelated email bodies.
4. Set reuse_previous_email = True ONLY if the current message explicitly references the previous draft (e.g. "Send it to X", "Send the draft", "Forward that email").
"""
        try:
            res = LLMService.generate_structured(
                prompt=prompt,
                schema_class=LLMReasoningSchema,
                system_prompt="You determine structured user intent with high precision, strictly separating action, purpose, and context dependencies without hallucinating or contaminating context."
            )
            return res
        except Exception as e:
            logger.error(f"LLM Reasoner error fallback: {e}")
            # Robust fallback using Layer A / Layer B / Layer C
            action_val = rule_signals.get("action_signal", ActionType.NON_EMAIL_TASK.value)
            purpose_val = rule_signals.get("purpose_signal") if rule_signals.get("purpose_confidence", 0) > 0.5 else semantic_scores.get("top_purpose", MessagePurpose.OTHER.value)
            
            return {
                "action": action_val,
                "message_purpose": purpose_val,
                "recipient": entities.get("recipient"),
                "subject": None,
                "requested_content": entities.get("requested_content"),
                "context_dependency": ContextDependency.NEW_TASK.value,
                "reuse_previous_email": False,
                "reasoning": "Fallback from deterministic and semantic layers",
                "confidence": 0.8
            }

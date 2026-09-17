import re
import uuid
import logging
from typing import Dict, Any, List, Optional
from backend.nlp.taxonomy import ActionType, MessagePurpose, ContextDependency, StructuredIntent

logger = logging.getLogger(__name__)


class ContextResolver:
    """
    Context Resolution & Task Session Management Module.
    Calculates context relevance, prevents cross-task email contamination, and maintains task session boundaries.
    """

    @staticmethod
    def resolve_context(
        new_query: str,
        llm_intent: Dict[str, Any],
        entities: Dict[str, Any],
        semantic_scores: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        
        q_lower = new_query.lower().strip()

        if not conversation_history:
            return {
                "context_dependency": ContextDependency.NEW_TASK,
                "reuse_previous_email": False,
                "relevance_score": 0.0,
                "previous_task_summary": None,
                "task_id": f"TASK_{uuid.uuid4().hex[:6]}"
            }

        # Find last assistant message and last user message
        last_assistant_msg = None
        last_user_msg = None

        for msg in reversed(conversation_history):
            role = msg.get("role")
            if not last_assistant_msg and role == "assistant":
                last_assistant_msg = msg
            if not last_user_msg and role == "user":
                last_user_msg = msg
            if last_assistant_msg and last_user_msg:
                break

        prev_text = (last_assistant_msg.get("content", "") + " " + (last_user_msg.get("content", "") if last_user_msg else "")).lower()

        # 1. Check for explicit references ("it", "the draft", "that message", "send it", "forward that", "previous draft")
        explicit_ref_phrases = ["send it", "send the draft", "send this draft", "send previous draft", "send the previous draft", "send previous email", "send the previous email", "forward it", "send message", "send that", "send reply"]
        has_explicit_ref = any(p in q_lower for p in explicit_ref_phrases) or (
            q_lower.startswith("send it to") or q_lower.startswith("sent it to") or 
            "previous draft" in q_lower or "previous email" in q_lower
        )

        # 2. Check entity overlap
        prev_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', prev_text)
        curr_email = entities.get("recipient_email")
        entity_overlap = 1.0 if (curr_email and curr_email.lower() in prev_text) else 0.0

        # 3. Calculate semantic similarity between current query and previous conversation turn
        prev_tokens = set(prev_text.split())
        curr_tokens = set(q_lower.split())
        intersection = curr_tokens.intersection(prev_tokens)
        union = curr_tokens.union(prev_tokens)
        semantic_sim = len(intersection) / len(union) if union else 0.0

        # 4. Purpose compatibility check
        prev_purpose_is_acceptance_or_invitation = any(w in prev_text for w in ["invitation", "showcase", "accept", "attendance", "scholarship"])
        curr_purpose = llm_intent.get("message_purpose")

        is_purpose_mismatch = (
            (curr_purpose in [MessagePurpose.ROMANTIC_PROPOSAL.value, MessagePurpose.THANK_YOU.value, MessagePurpose.APOLOGY.value]) and
            prev_purpose_is_acceptance_or_invitation and not has_explicit_ref
        )

        # 5. Calculate Relevance Score Formula:
        # Score = 0.4 * SemanticSim + 0.3 * EntityOverlap + 0.2 * ExplicitRef + 0.1 * Recency
        recency = 1.0  # Last turn
        relevance_score = (0.4 * semantic_sim) + (0.3 * entity_overlap) + (0.2 * (1.0 if has_explicit_ref else 0.0)) + (0.1 * recency)

        # 6. Decision Logic
        if has_explicit_ref and not is_purpose_mismatch:
            dependency = ContextDependency.CONTINUATION
            reuse = True
        elif is_purpose_mismatch or (relevance_score < 0.25 and not has_explicit_ref):
            dependency = ContextDependency.NEW_TASK
            reuse = False
        elif "change" in q_lower or "modify" in q_lower or "instead" in q_lower:
            dependency = ContextDependency.CORRECTION
            reuse = False
        else:
            # Default for independent new requests
            if llm_intent.get("context_dependency") == ContextDependency.NEW_TASK.value:
                dependency = ContextDependency.NEW_TASK
                reuse = False
            else:
                dependency = ContextDependency.CONTINUATION if has_explicit_ref else ContextDependency.NEW_TASK
                reuse = has_explicit_ref

        # Final safety check: ROMANTIC_PROPOSAL or explicit new purpose without explicit_ref NEVER reuses old email bodies
        if curr_purpose == MessagePurpose.ROMANTIC_PROPOSAL.value and not has_explicit_ref:
            dependency = ContextDependency.NEW_TASK
            reuse = False

        task_id = f"TASK_{uuid.uuid4().hex[:6]}" if dependency == ContextDependency.NEW_TASK else "ACTIVE_SESSION"

        return {
            "context_dependency": dependency,
            "reuse_previous_email": reuse,
            "relevance_score": round(relevance_score, 2),
            "previous_task_summary": prev_text[:200] if prev_text else None,
            "task_id": task_id
        }

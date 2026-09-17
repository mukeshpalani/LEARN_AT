import logging
from typing import Dict, Any, List, Optional
from backend.nlp.taxonomy import ActionType, MessagePurpose, ContextDependency, StructuredIntent
from backend.nlp.rules import DeterministicRules
from backend.nlp.entities import EntityExtractor
from backend.nlp.semantic_classifier import SemanticClassifier
from backend.nlp.llm_reasoner import LLMReasoner
from backend.nlp.context_resolver import ContextResolver

logger = logging.getLogger(__name__)


class HybridNLPEngine:
    """
    KnowledgePilot Central Hybrid NLP Understanding Engine.
    Combines:
      - Layer A: Deterministic Rules
      - Layer B: Entity Extractor
      - Layer C: Semantic Similarity Classifier
      - Layer D: LLM Semantic Reasoning
      - Context Resolver & Task Session Management
    """

    @staticmethod
    def process(query: str, conversation_history: Optional[List[Dict[str, Any]]] = None) -> StructuredIntent:
        logger.info(f"HybridNLPEngine processing query: '{query}'")

        # 1. Layer A — Deterministic Rules
        rule_signals = DeterministicRules.analyze(query)

        # 2. Layer B — Entity Extraction
        entities = EntityExtractor.extract(query)

        # 3. Layer C — Semantic Similarity Classification
        semantic_scores = SemanticClassifier.classify(query)

        # 4. Layer D — LLM Semantic Reasoning
        conv_context_summary = None
        if conversation_history and len(conversation_history) > 0:
            last_msg = conversation_history[-1].get("content", "")
            conv_context_summary = {"last_turn_snippet": last_msg[:150]}

        llm_intent = LLMReasoner.reason(
            query=query,
            rule_signals=rule_signals,
            entities=entities,
            semantic_scores=semantic_scores,
            conversation_context=conv_context_summary
        )

        # 5. Context Resolution & Contamination Prevention
        context_res = ContextResolver.resolve_context(
            new_query=query,
            llm_intent=llm_intent,
            entities=entities,
            semantic_scores=semantic_scores,
            conversation_history=conversation_history
        )

        # 6. Calculate Confidence Scores
        rule_conf = rule_signals.get("action_confidence", 0.5)
        semantic_conf = semantic_scores.get("top_score", 0.5)
        llm_conf = llm_intent.get("confidence", 0.9)
        overall_confidence = (0.3 * rule_conf) + (0.3 * semantic_conf) + (0.4 * llm_conf)

        # 7. Synthesize Final StructuredIntent
        final_action_str = llm_intent.get("action", rule_signals.get("action_signal", ActionType.NON_EMAIL_TASK.value))
        try:
            final_action = ActionType(final_action_str)
        except Exception:
            final_action = ActionType.NON_EMAIL_TASK

        # Determine Purpose: Priority rule signal if high confidence > 0.8, else LLM / Semantic
        rule_purpose = rule_signals.get("purpose_signal")
        rule_p_conf = rule_signals.get("purpose_confidence", 0)

        if rule_p_conf >= 0.9 and rule_purpose and rule_purpose != MessagePurpose.OTHER.value:
            final_purpose_str = rule_purpose
        else:
            final_purpose_str = llm_intent.get("message_purpose") or semantic_scores.get("top_purpose") or MessagePurpose.OTHER.value

        try:
            final_purpose = MessagePurpose(final_purpose_str)
        except Exception:
            final_purpose = MessagePurpose.OTHER

        recipient_val = entities.get("recipient") or llm_intent.get("recipient") or rule_signals.get("recipient_email")
        requested_content_val = entities.get("requested_content") or llm_intent.get("requested_content")

        structured_intent = StructuredIntent(
            action=final_action,
            message_purpose=final_purpose,
            recipient=recipient_val,
            sender=llm_intent.get("sender"),
            subject=llm_intent.get("subject"),
            requested_content=requested_content_val,
            context_dependency=context_res["context_dependency"],
            reuse_previous_email=context_res["reuse_previous_email"],
            confidence=overall_confidence,
            confidence_breakdown={
                "rule_confidence": rule_conf,
                "semantic_confidence": semantic_conf,
                "llm_confidence": llm_conf,
                "relevance_score": context_res["relevance_score"]
            },
            extracted_entities=entities,
            rule_signals=rule_signals,
            semantic_scores=semantic_scores.get("all_scores", {}),
            task_id=context_res["task_id"]
        )

        logger.info(f"HybridNLPEngine Intent: Action={structured_intent.action.value}, Purpose={structured_intent.message_purpose.value}, ReusePrev={structured_intent.reuse_previous_email}, TaskID={structured_intent.task_id}")
        return structured_intent

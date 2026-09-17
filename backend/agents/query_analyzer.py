import logging
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from backend.services.llm_service import LLMService

from backend.nlp import HybridNLPEngine, ActionType, MessagePurpose

logger = logging.getLogger(__name__)


class QueryAnalysisSchema(BaseModel):
    intent: str = Field(description="Primary user intent, e.g., document_qa, eligibility_analysis, data_summary, research, email_reply")
    complexity: str = Field(description="simple or multi_step")
    requires_rag: bool = Field(description="True if request requires retrieving evidence from uploaded documents")
    requires_data_analysis: bool = Field(description="True if request requires numerical/pandas calculation on CSV/XLSX/JSON")
    requires_research: bool = Field(description="True if request requires external web research for information not in documents")
    requires_report: bool = Field(description="True if request explicitly asks to generate a report")
    requires_email: bool = Field(default=False, description="True if request involves writing, drafting, replying to, or sending an email")
    email_action: Optional[str] = Field(default=None, description="Action state: SEND, DRAFT, CLARIFY, or None.")
    subtasks: List[str] = Field(default_factory=list, description="List of subtasks if multi_step query")


class QueryAnalyzerAgent:
    @staticmethod
    def analyze(query: str, conversation_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        logger.info(f"Running Query Analyzer Agent with HybridNLPEngine for query: '{query}'")
        
        # Process through 4-Layer Hybrid NLP Engine
        structured_intent = HybridNLPEngine.process(query, conversation_history=conversation_history)
        intent_dict = structured_intent.to_dict()

        requires_email = structured_intent.action in [
            ActionType.SEND_EMAIL, ActionType.DRAFT_EMAIL, ActionType.REPLY_EMAIL,
            ActionType.FORWARD_EMAIL, ActionType.EDIT_EMAIL
        ]
        
        email_action = None
        if structured_intent.action == ActionType.SEND_EMAIL:
            email_action = "SEND"
        elif structured_intent.action in [ActionType.DRAFT_EMAIL, ActionType.REPLY_EMAIL, ActionType.FORWARD_EMAIL, ActionType.EDIT_EMAIL]:
            email_action = "DRAFT"
        elif structured_intent.action == ActionType.CLARIFY:
            email_action = "CLARIFY"

        prompt = f"""Analyze the user query and determine operational requirements.

User Query: "{query}"
Detected Hybrid Intent: Action={structured_intent.action.value}, Purpose={structured_intent.message_purpose.value}

Determine:
1. intent: Primary goal (e.g., eligibility_analysis, document_qa, data_summary, external_research, email_reply)
2. complexity: "simple" or "multi_step"
3. requires_rag: Does it need information from uploaded documents? (False if purely email task)
4. requires_data_analysis: Does it need pandas/calculation on dataset?
5. requires_research: Does it require external web search?
6. requires_report: Does user ask to generate a multi-page executive report?
7. subtasks: List key steps to complete request.
"""
        result = LLMService.generate_structured(
            prompt=prompt,
            schema_class=QueryAnalysisSchema,
            system_prompt="You are an expert Query Analyzer Agent in KnowledgePilot."
        )

        if not result or "intent" not in result:
            result = {
                "intent": "email_reply" if requires_email else "document_qa",
                "complexity": "simple",
                "requires_rag": not requires_email,
                "requires_data_analysis": False,
                "requires_research": False,
                "requires_report": False,
                "subtasks": [query]
            }

        # Override email flags with Hybrid NLP Engine decisions
        result["requires_email"] = requires_email
        result["email_action"] = email_action
        result["structured_intent"] = intent_dict
        result["intent_metadata"] = intent_dict  # For frontend developer inspection panel

        logger.info(f"Query Analysis Result with Intent Metadata: {result['intent_metadata']}")
        return result


import logging
from typing import Dict, Any, List
from backend.orchestration.state import AgentState

logger = logging.getLogger(__name__)


class AgentRouter:
    @staticmethod
    def route(state: AgentState) -> str:
        """
        Determines next node in state graph based on query analysis & verification status.
        """
        analysis = state.get("analysis", {})
        verification = state.get("verification_results", {})
        retries = state.get("verification_retries", 0)

        # Check if coming from verification retry loop
        if verification and not verification.get("is_fully_supported", True) and retries < 2:
            logger.info(f"Verification failed unsupported claims. Triggering retry loop (retry #{retries + 1}).")
            if analysis.get("requires_research"):
                return "research_agent"
            return "rag_agent"

        # Initial routing logic based on analysis flags
        if analysis.get("requires_rag", True) and not state.get("retrieved_context"):
            return "rag_agent"
        elif analysis.get("requires_data_analysis") and not state.get("data_results"):
            return "data_agent"
        elif analysis.get("requires_research") and not state.get("research_results"):
            return "research_agent"
        elif not state.get("verification_results"):
            return "verifier"
        else:
            return "response_agent"

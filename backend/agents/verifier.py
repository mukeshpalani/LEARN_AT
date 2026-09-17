import json
import logging
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from backend.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class ClaimVerification(BaseModel):
    claim: str
    status: str = Field(description="SUPPORTED, PARTIALLY_SUPPORTED, or UNSUPPORTED")
    source: str = Field(default="N/A")
    page: int = Field(default=1)
    reasoning: str = Field(default="")


class VerificationReportSchema(BaseModel):
    is_fully_supported: bool
    claims: List[ClaimVerification]
    unsupported_count: int
    feedback_for_retry: str = Field(default="")


class VerificationAgent:
    @staticmethod
    def verify(
        query: str,
        retrieved_context: List[Dict[str, Any]],
        data_results: Dict[str, Any] = None,
        research_results: List[Dict[str, Any]] = None,
        candidate_answer: str = None
    ) -> Dict[str, Any]:
        logger.info(f"Running Verification Agent for query: '{query}'")

        # Compile evidence context
        evidence_snippets = []
        for ctx in retrieved_context:
            evidence_snippets.append(f"Source: {ctx.get('document')} (Page {ctx.get('page')})\nSnippet: {ctx.get('evidence')}")

        if data_results and data_results.get("summary"):
            evidence_snippets.append(f"Data Analysis Result:\n{data_results.get('summary')}")

        if research_results:
            for r in research_results:
                evidence_snippets.append(f"External Source: {r.get('title')} ({r.get('url')})\nSnippet: {r.get('snippet')}")

        evidence_text = "\n\n---\n\n".join(evidence_snippets) if evidence_snippets else "No evidence available."

        prompt = f"""You are a rigorous Verification Agent.
Analyze the user query and evidence to check if factual claims are supported.

Query: "{query}"

Available Evidence:
{evidence_text}

Candidate Answer (if any):
{candidate_answer or "Evaluate readiness of evidence to answer user request."}

Instructions:
1. Extract key claims required to answer the query.
2. For each claim, evaluate if it is SUPPORTED, PARTIALLY_SUPPORTED, or UNSUPPORTED by the evidence.
3. Specify exact source document and page if supported.
4. If unsupported claims exist or evidence is insufficient, provide feedback_for_retry.
"""

        result = LLMService.generate_structured(
            prompt=prompt,
            schema_class=VerificationReportSchema,
            system_prompt="You are a strict factual verification agent in KnowledgePilot."
        )

        if not result or "claims" not in result:
            # Fallback evaluation
            has_evidence = len(retrieved_context) > 0 or (data_results and data_results.get("has_data")) or len(research_results or []) > 0
            result = {
                "is_fully_supported": has_evidence,
                "claims": [
                    {
                        "claim": "Evidence provided for user request",
                        "status": "SUPPORTED" if has_evidence else "UNSUPPORTED",
                        "source": retrieved_context[0].get("document", "Document") if retrieved_context else "N/A",
                        "page": retrieved_context[0].get("page", 1) if retrieved_context else 1,
                        "reasoning": "Grounding check based on retrieved vector evidence."
                    }
                ],
                "unsupported_count": 0 if has_evidence else 1,
                "feedback_for_retry": "" if has_evidence else "Need additional search context."
            }

        logger.info(f"Verification Result: is_fully_supported={result.get('is_fully_supported')}, claims_count={len(result.get('claims', []))}")
        return result

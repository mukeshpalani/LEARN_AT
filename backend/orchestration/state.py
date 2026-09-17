import operator
from typing import TypedDict, List, Dict, Any, Optional, Annotated


class AgentRunLog(TypedDict):
    agent_name: str
    status: str  # running, completed, skipped, failed
    started_at: str
    completed_at: Optional[str]
    execution_time_ms: float
    output: Optional[Dict[str, Any]]
    error: Optional[str]


def reduce_agent_trace(left: List[AgentRunLog], right: List[AgentRunLog]) -> List[AgentRunLog]:
    """Custom reducer for updating agent runs in LangGraph."""
    res = list(left or [])
    for new_item in (right or []):
        # Update existing entry if present, else append
        existing_idx = next((i for i, item in enumerate(res) if item["agent_name"] == new_item["agent_name"] and item["status"] == "running"), None)
        if existing_idx is not None:
            res[existing_idx] = new_item
        else:
            res.append(new_item)
    return res


class AgentState(TypedDict, total=False):
    task_id: str
    conversation_id: str
    query: str
    conversation_history: List[Dict[str, Any]]
    access_token: Optional[str]
    from_email: Optional[str]
    
    # Analysis & Plan
    analysis: Dict[str, Any]
    structured_intent: Dict[str, Any]
    intent_metadata: Dict[str, Any]
    plan: Dict[str, Any]
    
    # Tool/Retrieval Execution Results
    retrieved_context: List[Dict[str, Any]]
    research_results: List[Dict[str, Any]]
    data_results: Dict[str, Any]
    email_draft: Dict[str, Any]
    
    # Verification & Final Output
    verification_results: Dict[str, Any]
    verification_retries: int
    final_response: str
    citations: List[Dict[str, Any]]
    
    # Observability & Errors (accumulates trace across nodes)
    agent_trace: Annotated[List[AgentRunLog], reduce_agent_trace]
    errors: List[str]

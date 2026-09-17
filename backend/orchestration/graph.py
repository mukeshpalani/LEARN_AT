import time
import datetime
import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from backend.orchestration.state import AgentState, AgentRunLog
from backend.agents.query_analyzer import QueryAnalyzerAgent
from backend.agents.planner import PlanningAgent
from backend.agents.rag_agent import RAGAgent
from backend.agents.data_agent import DataAgent
from backend.agents.research_agent import ResearchAgent
from backend.agents.email_agent import EmailAgent
from backend.agents.verifier import VerificationAgent
from backend.agents.response_agent import ResponseAgent

logger = logging.getLogger(__name__)


def create_agent_log(agent_name: str, status: str, time_ms: float = 0.0, output: Any = None, error: str = None) -> AgentRunLog:
    return {
        "agent_name": agent_name,
        "status": status,
        "started_at": datetime.datetime.now().isoformat(),
        "completed_at": datetime.datetime.now().isoformat(),
        "execution_time_ms": time_ms,
        "output": output if isinstance(output, dict) else {"summary": str(output)[:300]} if output else None,
        "error": error
    }


def analyze_query_node(state: AgentState) -> dict:
    t0 = time.time()
    try:
        analysis = QueryAnalyzerAgent.analyze(state["query"], conversation_history=state.get("conversation_history"))
        t_ms = round((time.time() - t0) * 1000, 2)
        log_item = create_agent_log("query_analyzer", "completed", t_ms, output=analysis)
        intent_meta = analysis.get("intent_metadata")
        struct_intent = analysis.get("structured_intent")
        return {
            "analysis": analysis,
            "structured_intent": struct_intent,
            "intent_metadata": intent_meta,
            "agent_trace": [log_item]
        }
    except Exception as e:
        logger.error(f"Query analyzer node error: {e}")
        log_item = create_agent_log("query_analyzer", "failed", error=str(e))
        return {"analysis": {"intent": "general", "complexity": "simple", "requires_rag": True}, "agent_trace": [log_item]}


def plan_node(state: AgentState) -> dict:
    t0 = time.time()
    try:
        plan = PlanningAgent.plan(state["query"], state.get("analysis", {}))
        t_ms = round((time.time() - t0) * 1000, 2)
        log_item = create_agent_log("planner", "completed", t_ms, output=plan)
        return {"plan": plan, "agent_trace": [log_item]}
    except Exception as e:
        logger.error(f"Planner node error: {e}")
        log_item = create_agent_log("planner", "failed", error=str(e))
        return {"plan": {"plan_overview": "Direct execution", "tasks": []}, "agent_trace": [log_item]}


def rag_node(state: AgentState) -> dict:
    t0 = time.time()
    try:
        rag_agent = RAGAgent()
        retrieved = rag_agent.run(state["query"], state.get("plan"))
        t_ms = round((time.time() - t0) * 1000, 2)
        log_item = create_agent_log("rag_agent", "completed", t_ms, output={"retrieved_count": len(retrieved)})
        return {"retrieved_context": retrieved, "agent_trace": [log_item]}
    except Exception as e:
        logger.error(f"RAG node error: {e}")
        log_item = create_agent_log("rag_agent", "failed", error=str(e))
        return {"retrieved_context": [], "agent_trace": [log_item]}


def data_node(state: AgentState) -> dict:
    t0 = time.time()
    try:
        data_res = DataAgent.run(state["query"])
        t_ms = round((time.time() - t0) * 1000, 2)
        log_item = create_agent_log("data_agent", "completed", t_ms, output=data_res)
        return {"data_results": data_res, "agent_trace": [log_item]}
    except Exception as e:
        logger.error(f"Data node error: {e}")
        log_item = create_agent_log("data_agent", "failed", error=str(e))
        return {"data_results": {"has_data": False, "summary": f"Data analysis error: {e}"}, "agent_trace": [log_item]}


def research_node(state: AgentState) -> dict:
    t0 = time.time()
    try:
        research_res = ResearchAgent.run(state["query"])
        t_ms = round((time.time() - t0) * 1000, 2)
        log_item = create_agent_log("research_agent", "completed", t_ms, output={"results_count": len(research_res)})
        return {"research_results": research_res, "agent_trace": [log_item]}
    except Exception as e:
        logger.error(f"Research node error: {e}")
        log_item = create_agent_log("research_agent", "failed", error=str(e))
        return {"research_results": [], "agent_trace": [log_item]}


def email_node(state: AgentState) -> dict:
    t0 = time.time()
    try:
        analysis = state.get("analysis", {})
        draft = EmailAgent.run(
            query=state["query"],
            retrieved_context=state.get("retrieved_context"),
            access_token=state.get("access_token"),
            from_email=state.get("from_email"),
            email_action=analysis.get("email_action"),
            conversation_history=state.get("conversation_history"),
            structured_intent=state.get("structured_intent")
        )
        t_ms = round((time.time() - t0) * 1000, 2)
        status_val = draft.get("status", "drafted")
        log_item = create_agent_log("email_agent", "completed", t_ms, output={"recipient": draft.get("recipient"), "status": status_val, "email_action": draft.get("email_action")})
        return {"email_draft": draft, "agent_trace": [log_item]}
    except Exception as e:
        logger.error(f"Email node error: {e}")
        log_item = create_agent_log("email_agent", "failed", error=str(e))
        return {"email_draft": None, "agent_trace": [log_item]}


def verify_node(state: AgentState) -> dict:
    t0 = time.time()
    try:
        ver_res = VerificationAgent.verify(
            query=state["query"],
            retrieved_context=state.get("retrieved_context", []),
            data_results=state.get("data_results"),
            research_results=state.get("research_results")
        )
        t_ms = round((time.time() - t0) * 1000, 2)
        retries = state.get("verification_retries", 0)
        log_item = create_agent_log("verifier", "completed", t_ms, output=ver_res)
        return {"verification_results": ver_res, "verification_retries": retries + 1, "agent_trace": [log_item]}
    except Exception as e:
        logger.error(f"Verifier node error: {e}")
        log_item = create_agent_log("verifier", "failed", error=str(e))
        return {"verification_results": {"is_fully_supported": True, "claims": []}, "agent_trace": [log_item]}


def response_node(state: AgentState) -> dict:
    t0 = time.time()
    try:
        res = ResponseAgent.generate_response(
            query=state["query"],
            retrieved_context=state.get("retrieved_context", []),
            data_results=state.get("data_results"),
            research_results=state.get("research_results"),
            verification_results=state.get("verification_results"),
            plan=state.get("plan"),
            email_draft=state.get("email_draft")
        )
        t_ms = round((time.time() - t0) * 1000, 2)
        log_item = create_agent_log("response_agent", "completed", t_ms, output={"citations_count": len(res.get("citations", []))})
        return {
            "final_response": res.get("final_response", ""),
            "citations": res.get("citations", []),
            "email_draft": res.get("email_draft"),
            "agent_trace": [log_item]
        }
    except Exception as e:
        logger.error(f"Response node error: {e}")
        log_item = create_agent_log("response_agent", "failed", error=str(e))
        return {"final_response": f"Error generating response: {e}", "citations": [], "agent_trace": [log_item]}


# Build LangGraph Workflow
def build_multi_agent_graph():
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("query_analyzer", analyze_query_node)
    workflow.add_node("planner", plan_node)
    workflow.add_node("rag_agent", rag_node)
    workflow.add_node("data_agent", data_node)
    workflow.add_node("research_agent", research_node)
    workflow.add_node("email_agent", email_node)
    workflow.add_node("verifier", verify_node)
    workflow.add_node("response_agent", response_node)

    # Set Entry Point
    workflow.set_entry_point("query_analyzer")

    # Edges
    workflow.add_edge("query_analyzer", "planner")

    # Conditional router after planner
    def route_after_planner(state: AgentState):
        analysis = state.get("analysis", {})
        if analysis.get("requires_email"):
            return "email_agent"
        elif analysis.get("requires_rag", True):
            return "rag_agent"
        elif analysis.get("requires_data_analysis"):
            return "data_agent"
        elif analysis.get("requires_research"):
            return "research_agent"
        else:
            return "verifier"

    workflow.add_conditional_edges(
        "planner",
        route_after_planner,
        {
            "email_agent": "email_agent",
            "rag_agent": "rag_agent",
            "data_agent": "data_agent",
            "research_agent": "research_agent",
            "verifier": "verifier"
        }
    )

    workflow.add_edge("email_agent", "response_agent")

    # After RAG, check if data analysis or research also needed
    def route_after_rag(state: AgentState):
        analysis = state.get("analysis", {})
        if analysis.get("requires_email"):
            return "email_agent"
        elif analysis.get("requires_data_analysis") and not state.get("data_results"):
            return "data_agent"
        elif analysis.get("requires_research") and not state.get("research_results"):
            return "research_agent"
        else:
            return "verifier"

    workflow.add_conditional_edges(
        "rag_agent",
        route_after_rag,
        {
            "email_agent": "email_agent",
            "data_agent": "data_agent",
            "research_agent": "research_agent",
            "verifier": "verifier"
        }
    )

    # After Data Agent, check if research needed
    def route_after_data(state: AgentState):
        analysis = state.get("analysis", {})
        if analysis.get("requires_research") and not state.get("research_results"):
            return "research_agent"
        else:
            return "verifier"

    workflow.add_conditional_edges(
        "data_agent",
        route_after_data,
        {
            "research_agent": "research_agent",
            "verifier": "verifier"
        }
    )

    workflow.add_edge("research_agent", "verifier")

    # After Verifier: retry if unsupported claims exist and retries < 2, else response_agent
    def route_after_verifier(state: AgentState):
        ver = state.get("verification_results", {})
        retries = state.get("verification_retries", 0)
        if not ver.get("is_fully_supported", True) and retries == 1:
            analysis = state.get("analysis", {})
            if analysis.get("requires_research") and not state.get("research_results"):
                return "research_agent"
        return "response_agent"

    workflow.add_conditional_edges(
        "verifier",
        route_after_verifier,
        {
            "rag_agent": "rag_agent",
            "research_agent": "research_agent",
            "response_agent": "response_agent"
        }
    )

    workflow.add_edge("response_agent", END)

    return workflow.compile()


multi_agent_app = build_multi_agent_graph()

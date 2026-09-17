import logging
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from backend.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class TaskSchema(BaseModel):
    task_id: int
    description: str
    required_agent: str  # rag_agent, data_agent, research_agent, verifier, response_agent
    dependencies: List[int] = Field(default_factory=list)
    status: str = "pending"


class PlanSchema(BaseModel):
    plan_overview: str
    tasks: List[TaskSchema]


class PlanningAgent:
    @staticmethod
    def plan(query: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Running Planning Agent for query: '{query}'")

        prompt = f"""Create a clear execution plan for the user query based on the analysis.

User Query: "{query}"
Analysis: {analysis}

Available Agents:
- rag_agent: Retrieves document evidence from knowledge base (PDF/DOCX/TXT).
- data_agent: Performs pandas operations on CSV/Excel/JSON data.
- research_agent: Performs web search for external info.
- verifier: Verifies claims against evidence.
- response_agent: Formats final response with citations.

Create an ordered list of tasks with task_id (1, 2, 3...), description, required_agent, and dependencies.
"""
        result = LLMService.generate_structured(
            prompt=prompt,
            schema_class=PlanSchema,
            system_prompt="You are an expert Planning Agent in KnowledgePilot."
        )

        if not result or "tasks" not in result or not result["tasks"]:
            # Fallback deterministic plan
            tasks = []
            t_id = 1
            if analysis.get("requires_rag", True):
                tasks.append({"task_id": t_id, "description": "Retrieve document evidence from vector store", "required_agent": "rag_agent", "dependencies": [], "status": "pending"})
                t_id += 1
            if analysis.get("requires_data_analysis", False):
                tasks.append({"task_id": t_id, "description": "Execute Python/Pandas analysis on structured files", "required_agent": "data_agent", "dependencies": [], "status": "pending"})
                t_id += 1
            if analysis.get("requires_research", False):
                tasks.append({"task_id": t_id, "description": "Search external web sources", "required_agent": "research_agent", "dependencies": [], "status": "pending"})
                t_id += 1
            tasks.append({"task_id": t_id, "description": "Verify extracted claims against evidence", "required_agent": "verifier", "dependencies": [i for i in range(1, t_id)], "status": "pending"})
            t_id += 1
            tasks.append({"task_id": t_id, "description": "Format final cited answer", "required_agent": "response_agent", "dependencies": [t_id - 1], "status": "pending"})

            result = {
                "plan_overview": f"Execution plan for query: {query}",
                "tasks": tasks
            }

        logger.info(f"Generated Plan: {result}")
        return result

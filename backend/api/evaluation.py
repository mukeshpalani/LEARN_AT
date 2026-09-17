from fastapi import APIRouter
from backend.evaluation.evaluator import SystemEvaluator

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])


@router.get("/run")
def run_evaluation():
    """Runs benchmark evaluation comparing LLM Only vs LLM+RAG vs LLM+RAG+Multi-Agent."""
    return SystemEvaluator.run_benchmark()

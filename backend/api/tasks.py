from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models import Task, AgentRun, Citation
from backend.models.schemas import TaskStatusResponse

router = APIRouter(prefix="", tags=["Tasks & Agent Observability"])


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
def get_task_status(task_id: str, db: Session = Depends(get_db)):
    """Retrieves full task execution details and agent runs."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    runs = db.query(AgentRun).filter(AgentRun.task_id == task_id).order_by(AgentRun.started_at.asc()).all()
    citations = db.query(Citation).filter(Citation.task_id == task_id).all()

    agent_runs_data = [{
        "agent_name": r.agent_name,
        "status": r.status,
        "started_at": r.started_at,
        "completed_at": r.completed_at,
        "execution_time_ms": r.execution_time_ms,
        "output": r.output_json,
        "error": r.error
    } for r in runs]

    citations_data = [{
        "citation_id": idx + 1,
        "document": c.filename,
        "document_id": c.document_id,
        "page": c.page_number,
        "chunk_id": c.chunk_id,
        "evidence": c.evidence
    } for idx, c in enumerate(citations)]

    return TaskStatusResponse(
        task_id=task.id,
        conversation_id=task.conversation_id,
        query=task.query,
        status=task.status,
        created_at=task.created_at,
        completed_at=task.completed_at,
        agent_runs=agent_runs_data,
        citations=citations_data,
        result=task.result_json
    )


@router.get("/agents/status/{task_id}")
def get_agent_execution_timeline(task_id: str, db: Session = Depends(get_db)):
    """Retrieves real-time agent execution timeline for observability interface."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    runs = db.query(AgentRun).filter(AgentRun.task_id == task_id).order_by(AgentRun.started_at.asc()).all()

    return {
        "task_id": task.id,
        "status": task.status,
        "query": task.query,
        "analysis": task.analysis_json,
        "plan": task.plan_json,
        "timeline": [{
            "agent_name": r.agent_name,
            "status": r.status,
            "execution_time_ms": r.execution_time_ms,
            "started_at": r.started_at,
            "completed_at": r.completed_at,
            "error": r.error
        } for r in runs]
    }

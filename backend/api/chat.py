import datetime
import logging
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models import Conversation, Message, Task, AgentRun, Citation
from backend.models.schemas import ChatRequest, ChatResponse
from backend.orchestration.graph import multi_agent_app
from backend.orchestration.state import AgentState

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Chat & Agents"])


@router.post("/chat", response_model=ChatResponse)
def execute_chat(req: ChatRequest, db: Session = Depends(get_db)):
    """Executes multi-agent query workflow."""
    # 1. Ensure conversation exists
    conversation_id = req.conversation_id
    if not conversation_id:
        conv = Conversation(title=req.query[:40])
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conversation_id = conv.id
    else:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            conv = Conversation(id=conversation_id, title=req.query[:40])
            db.add(conv)
            db.commit()

    # Load conversation context history
    history_records = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.timestamp.asc()).all()
    conversation_history = [{"role": msg.role, "content": msg.content} for msg in history_records]

    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=req.query
    )
    db.add(user_msg)

    # 2. Create Task record
    task_id = str(uuid.uuid4())
    task_record = Task(
        id=task_id,
        conversation_id=conversation_id,
        query=req.query,
        status="running"
    )
    db.add(task_record)
    db.commit()

    # 3. Initial AgentState
    initial_state: AgentState = {
        "task_id": task_id,
        "conversation_id": conversation_id,
        "query": req.query,
        "conversation_history": conversation_history,
        "access_token": req.access_token,
        "from_email": req.from_email,
        "verification_retries": 0,
        "agent_trace": [],
        "errors": []
    }

    try:
        # 4. Invoke LangGraph multi-agent execution state machine
        final_state = multi_agent_app.invoke(initial_state)

        # Update Task record
        task_record.status = "completed"
        task_record.completed_at = datetime.datetime.now(datetime.timezone.utc)
        task_record.analysis_json = final_state.get("analysis")
        task_record.plan_json = final_state.get("plan")
        task_record.result_json = {
            "final_response": final_state.get("final_response"),
            "verification_results": final_state.get("verification_results"),
            "email_draft": final_state.get("email_draft")
        }

        # Save Agent Runs to DB
        trace = final_state.get("agent_trace", [])
        for entry in trace:
            db_run = AgentRun(
                task_id=task_id,
                agent_name=entry.get("agent_name"),
                status=entry.get("status", "completed"),
                execution_time_ms=entry.get("execution_time_ms", 0.0),
                output_json=entry.get("output"),
                error=entry.get("error")
            )
            db.add(db_run)

        # Save Citations to DB
        citations_data = final_state.get("citations", [])
        for cit in citations_data:
            db_cit = Citation(
                task_id=task_id,
                document_id=cit.get("document_id", ""),
                filename=cit.get("document", "Document"),
                page_number=cit.get("page", 1),
                chunk_id=cit.get("chunk_id", ""),
                evidence=cit.get("evidence", "")
            )
            db.add(db_cit)

        # Save Assistant Message
        asst_msg = Message(
            conversation_id=conversation_id,
            task_id=task_id,
            role="assistant",
            content=final_state.get("final_response", ""),
            citations_json=citations_data
        )
        db.add(asst_msg)

        db.commit()

        return ChatResponse(
            task_id=task_id,
            conversation_id=conversation_id,
            query=req.query,
            final_response=final_state.get("final_response", ""),
            citations=citations_data,
            analysis=final_state.get("analysis"),
            plan=final_state.get("plan"),
            agent_trace=trace,
            verification_results=final_state.get("verification_results"),
            email_draft=final_state.get("email_draft"),
            intent_metadata=final_state.get("intent_metadata")
        )

    except Exception as e:
        logger.error(f"Chat workflow execution error: {e}", exc_info=True)
        task_record.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Multi-agent execution failed: {str(e)}")


@router.get("/conversations")
def list_conversations(db: Session = Depends(get_db)):
    """Lists all conversations."""
    return db.query(Conversation).order_by(Conversation.updated_at.desc()).all()


@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db)):
    """Retrieves messages for a conversation."""
    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.timestamp.asc()).all()

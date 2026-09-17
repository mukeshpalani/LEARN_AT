import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models import Task, Citation
from backend.agents.report_agent import ReportAgent
from backend.models.schemas import ReportGenerateRequest, ReportGenerateResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate", response_model=ReportGenerateResponse)
def generate_report(req: ReportGenerateRequest, db: Session = Depends(get_db)):
    """Generates structured report from verified task results."""
    final_response = "Generated Report Summary"
    citations_data = []

    if req.task_id:
        task = db.query(Task).filter(Task.id == req.task_id).first()
        if task and task.result_json:
            final_response = task.result_json.get("final_response", "")
        cits = db.query(Citation).filter(Citation.task_id == req.task_id).all()
        citations_data = [{"document": c.filename, "page": c.page_number} for c in cits]

    report_result = ReportAgent.generate_report(
        title=req.title,
        query=req.query,
        final_response=final_response,
        citations=citations_data,
        format_type=req.format_type
    )

    return ReportGenerateResponse(
        title=report_result["title"],
        report_markdown=report_result["report_markdown"],
        files=report_result["files"],
        primary_file=report_result["primary_file"]
    )


@router.get("/download")
def download_report(file_path: str):
    """Downloads generated report file safely within REPORTS_DIR boundary."""
    reports_dir = Path(settings.REPORTS_DIR).resolve()
    target_path = Path(file_path).resolve()

    # Prevent path traversal outside reports directory
    try:
        target_path.relative_to(reports_dir)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied: Cannot access files outside reports directory")

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found")

    return FileResponse(path=str(target_path), filename=target_path.name)

import os
import shutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database.connection import get_db
from backend.database.models import Document, DocumentChunk
from backend.rag.ingestion import IngestionPipeline
from backend.models.schemas import DocumentResponse

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("general"),
    db: Session = Depends(get_db)
):
    """Uploads and ingests a document into the KnowledgePilot system."""
    filename = Path(file.filename).name
    ext = Path(filename).suffix.lower()

    supported_exts = [".pdf", ".docx", ".doc", ".txt", ".csv", ".xlsx", ".xls", ".json"]
    if ext not in supported_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(supported_exts)}"
        )

    # Save to disk securely inside DOCUMENTS_DIR boundary
    upload_dir = Path(settings.DOCUMENTS_DIR).resolve()
    target_path = (upload_dir / filename).resolve()

    try:
        target_path.relative_to(upload_dir)
    except ValueError:
        raise HTTPException(status_code=403, detail="Invalid filename: Path traversal attempt detected")

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process ingestion
    pipeline = IngestionPipeline(db)
    doc_record = pipeline.process_file(
        file_path=str(target_path),
        filename=filename,
        category=category
    )

    return doc_record


@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    """Lists all ingested documents."""
    return db.query(Document).order_by(Document.upload_time.desc()).all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    """Retrieves document details."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{document_id}/chunks")
def get_document_chunks(document_id: str, db: Session = Depends(get_db)):
    """Retrieves chunk metadata for a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all()
    return [{
        "chunk_id": c.chunk_id,
        "page_number": c.page_number,
        "text_preview": c.chunk_text[:200] + "...",
        "metadata": c.metadata_json
    } for c in chunks]


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Deletes document, database chunks, and vector store entries."""
    pipeline = IngestionPipeline(db)
    success = pipeline.delete_file(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document successfully deleted", "document_id": document_id}

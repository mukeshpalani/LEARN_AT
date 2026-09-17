from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    category: str
    status: str
    chunk_count: int
    upload_time: datetime
    error_message: Optional[str] = None


class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    filter_document_id: Optional[str] = None
    access_token: Optional[str] = None
    from_email: Optional[str] = None


class CitationItem(BaseModel):
    citation_id: Optional[int] = 1
    document: str = "Document"
    document_id: Optional[str] = ""
    page: int = 1
    chunk_id: Optional[str] = ""
    evidence: Optional[str] = ""


class ChatResponse(BaseModel):
    task_id: str
    conversation_id: str
    query: str
    final_response: str
    citations: List[CitationItem]
    analysis: Optional[Dict[str, Any]] = None
    plan: Optional[Dict[str, Any]] = None
    agent_trace: List[Dict[str, Any]] = Field(default_factory=list)
    verification_results: Optional[Dict[str, Any]] = None
    email_draft: Optional[Dict[str, Any]] = None
    intent_metadata: Optional[Dict[str, Any]] = None


class TaskStatusResponse(BaseModel):
    task_id: str
    conversation_id: str
    query: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    agent_runs: List[Dict[str, Any]] = Field(default_factory=list)
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    result: Optional[Dict[str, Any]] = None


class ReportGenerateRequest(BaseModel):
    title: str
    query: str
    task_id: Optional[str] = None
    format_type: str = "markdown"  # markdown, pdf, docx


class ReportGenerateResponse(BaseModel):
    title: str
    report_markdown: str
    files: Dict[str, str]
    primary_file: str


class EmailDraftSchema(BaseModel):
    recipient: Optional[str] = Field(default=None, description="Target recipient email address or recipient name")
    subject: Optional[str] = Field(default="Response to your email", description="Subject line for the email")
    body: Optional[str] = Field(default=None, description="Full text body of the drafted email response")
    reasoning: Optional[str] = Field(default="", description="Brief explanation of email intent analysis and response strategy")
    email_action: str = Field(default="DRAFT", description="SEND, DRAFT, or CLARIFY")
    missing_field: Optional[str] = Field(default=None, description="recipient, content, or None if CLARIFY required")
    clarification_prompt: Optional[str] = Field(default=None, description="Question to ask user if clarification is needed")


class EmailSendRequest(BaseModel):
    recipient: str
    subject: str
    body: str
    from_email: Optional[str] = None
    access_token: Optional[str] = None


class EmailSendResponse(BaseModel):
    status: str
    recipient: str
    subject: str
    sent_at: str
    message: str
    message_id: Optional[str] = None

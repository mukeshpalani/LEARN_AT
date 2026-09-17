from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ActionType(str, Enum):
    SEND_EMAIL = "SEND_EMAIL"
    DRAFT_EMAIL = "DRAFT_EMAIL"
    REPLY_EMAIL = "REPLY_EMAIL"
    FORWARD_EMAIL = "FORWARD_EMAIL"
    SUMMARIZE_EMAIL = "SUMMARIZE_EMAIL"
    READ_EMAIL = "READ_EMAIL"
    SEARCH_EMAIL = "SEARCH_EMAIL"
    EDIT_EMAIL = "EDIT_EMAIL"
    DELETE_EMAIL = "DELETE_EMAIL"
    CLARIFY = "CLARIFY"
    NON_EMAIL_TASK = "NON_EMAIL_TASK"
    FILE_SEARCH = "FILE_SEARCH"
    DATA_ANALYSIS = "DATA_ANALYSIS"
    RAG_QA = "RAG_QA"
    REPORT_GENERATION = "REPORT_GENERATION"


class MessagePurpose(str, Enum):
    PROFESSIONAL = "PROFESSIONAL"
    ACADEMIC = "ACADEMIC"
    PERSONAL = "PERSONAL"
    REQUEST = "REQUEST"
    INVITATION = "INVITATION"
    ACCEPTANCE = "ACCEPTANCE"
    REJECTION = "REJECTION"
    FOLLOW_UP = "FOLLOW_UP"
    APOLOGY = "APOLOGY"
    THANK_YOU = "THANK_YOU"
    REMINDER = "REMINDER"
    INFORMATION_REQUEST = "INFORMATION_REQUEST"
    ROMANTIC_PROPOSAL = "ROMANTIC_PROPOSAL"
    BUSINESS_PROPOSAL = "BUSINESS_PROPOSAL"
    EVENT_PROPOSAL = "EVENT_PROPOSAL"
    GENERIC_EMAIL = "GENERIC_EMAIL"
    OTHER = "OTHER"


class ContextDependency(str, Enum):
    NEW_TASK = "NEW_TASK"
    CONTINUATION = "CONTINUATION"
    CORRECTION = "CORRECTION"
    REFERENCE = "REFERENCE"


class StructuredIntent(BaseModel):
    action: ActionType = Field(default=ActionType.NON_EMAIL_TASK, description="Action type")
    message_purpose: MessagePurpose = Field(default=MessagePurpose.OTHER, description="Message purpose classification")
    recipient: Optional[str] = Field(default=None, description="Extracted recipient email or name")
    sender: Optional[str] = Field(default=None, description="Extracted sender email or name")
    subject: Optional[str] = Field(default=None, description="Extracted email subject")
    requested_content: Optional[str] = Field(default=None, description="Specific content requested by user")
    context_dependency: ContextDependency = Field(default=ContextDependency.NEW_TASK, description="Context dependency state")
    reuse_previous_email: bool = Field(default=False, description="True ONLY if current task directly continues previous email draft")
    confidence: float = Field(default=1.0, description="Overall intent confidence score 0.0 - 1.0")
    confidence_breakdown: Dict[str, float] = Field(default_factory=dict, description="Confidence per layer")
    extracted_entities: Dict[str, Any] = Field(default_factory=dict, description="Extracted entity details")
    rule_signals: Dict[str, Any] = Field(default_factory=dict, description="Layer A rule signals")
    semantic_scores: Dict[str, float] = Field(default_factory=dict, description="Layer C semantic scores")
    task_id: str = Field(default="", description="Unique task session ID")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "action": self.action.value,
            "message_purpose": self.message_purpose.value,
            "recipient": self.recipient,
            "sender": self.sender,
            "subject": self.subject,
            "requested_content": self.requested_content,
            "context_dependency": self.context_dependency.value,
            "reuse_previous_email": self.reuse_previous_email,
            "confidence": round(self.confidence, 2),
            "confidence_breakdown": {k: round(v, 2) for k, v in self.confidence_breakdown.items()},
            "extracted_entities": self.extracted_entities,
            "rule_signals": self.rule_signals,
            "semantic_scores": {k: round(v, 2) for k, v in self.semantic_scores.items()},
            "task_id": self.task_id
        }

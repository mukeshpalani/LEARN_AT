import logging
from fastapi import APIRouter, HTTPException
from backend.models.schemas import EmailSendRequest, EmailSendResponse
from backend.tools.email_tool import EmailTool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/email", tags=["Email Tool"])


@router.post("/send", response_model=EmailSendResponse)
def send_email_endpoint(req: EmailSendRequest):
    """Sends an email via Gmail API after explicit user approval in the UI."""
    try:
        logger.info(f"Received user approval to send email to {req.recipient}")
        result = EmailTool.send_email(
            recipient=req.recipient,
            subject=req.subject,
            body=req.body,
            from_email=req.from_email,
            access_token=req.access_token
        )
        return EmailSendResponse(**result)
    except Exception as e:
        logger.error(f"Failed to send email: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Email delivery failed: {str(e)}")

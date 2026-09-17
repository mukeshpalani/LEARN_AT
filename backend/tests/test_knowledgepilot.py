import os
import pytest
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.models import Base, Document, DocumentChunk
from backend.rag.parser import DocumentParser, ParsedDocument, ParsedPage
from backend.rag.chunking import ChunkingEngine
from backend.rag.retrieval import QdrantVectorStore
from backend.agents.query_analyzer import QueryAnalyzerAgent
from backend.agents.planner import PlanningAgent
from backend.agents.verifier import VerificationAgent
from backend.agents.response_agent import ResponseAgent
from backend.tools.python_tool import PythonDataTool
from backend.orchestration.graph import multi_agent_app


# Test Setup: Temporary DB Engine
@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_document_parser_txt(tmp_path):
    txt_file = tmp_path / "sample.txt"
    txt_file.write_text("Scholarship guidelines require 75% attendance.", encoding="utf-8")

    parsed = DocumentParser.parse_file(str(txt_file), "sample.txt")
    assert parsed.filename == "sample.txt"
    assert parsed.file_type == "txt"
    assert len(parsed.pages) == 1
    assert "75% attendance" in parsed.pages[0].content


def test_chunking_engine():
    pages = [
        ParsedPage(page_number=1, content="This is page one content. " * 30),
        ParsedPage(page_number=2, content="This is page two content. " * 30)
    ]
    doc = ParsedDocument(filename="test.pdf", file_type="pdf", pages=pages)
    chunker = ChunkingEngine(chunk_size=200, overlap=30)
    chunks = chunker.chunk_document(doc, "doc_123")

    assert len(chunks) > 0
    assert chunks[0].document_id == "doc_123"
    assert chunks[0].page_number in [1, 2]
    assert "chunk_id" in chunks[0].metadata


def test_query_analyzer_agent():
    analysis = QueryAnalyzerAgent.analyze("Find scholarship eligibility requirements and calculate attendance")
    assert "intent" in analysis
    assert "complexity" in analysis
    assert analysis["requires_rag"] is True


def test_planning_agent():
    analysis = {"intent": "eligibility_analysis", "complexity": "multi_step", "requires_rag": True, "requires_data_analysis": True, "requires_research": False}
    plan = PlanningAgent.plan("Analyze scholarship requirements", analysis)
    assert "tasks" in plan
    assert len(plan["tasks"]) > 0


def test_python_data_tool():
    code = """
import pandas as pd
df = pd.DataFrame({'name': ['Alice', 'Bob'], 'attendance': [90, 70]})
result = df[df['attendance'] < 75]['name'].tolist()
"""
    out = PythonDataTool.execute_pandas_code(code)
    assert out["success"] is True
    assert "Bob" in out["result"]


def test_verifier_agent():
    retrieved = [{
        "document": "Attendance_Policy.pdf",
        "page": 14,
        "evidence": "Minimum required attendance is 75%."
    }]
    ver = VerificationAgent.verify(
        query="What is attendance requirement?",
        retrieved_context=retrieved,
        candidate_answer="Students need 75% attendance."
    )
    assert "is_fully_supported" in ver
    assert len(ver["claims"]) > 0


def test_response_agent_citations():
    retrieved = [{
        "document": "Scholarship_Guidelines.pdf",
        "document_id": "doc_1",
        "page": 7,
        "chunk_id": "c_1",
        "evidence": "Applicants must submit application form and transcripts."
    }]
    res = ResponseAgent.generate_response(
        query="What documents are needed?",
        retrieved_context=retrieved,
        verification_results={"is_fully_supported": True}
    )
    assert "final_response" in res
    assert len(res["citations"]) == 1
    assert res["citations"][0]["document"] == "Scholarship_Guidelines.pdf"
    assert res["citations"][0]["page"] == 7


def test_integration_multi_agent_workflow():
    initial_state = {
        "task_id": "test_integration_task",
        "conversation_id": "conv_1",
        "query": "Analyze scholarship requirements",
        "verification_retries": 0,
        "agent_trace": [],
        "errors": []
    }
    final_state = multi_agent_app.invoke(initial_state)

    assert "final_response" in final_state
    assert "agent_trace" in final_state
    assert len(final_state["agent_trace"]) >= 4


def test_modular_tools_layer():
    from backend.tools.file_search import FileSearchTool
    from backend.tools.rag_tool import RAGTool
    from backend.tools.data_tool import DataAnalysisTool
    from backend.tools.report_tool import ReportTool

    # 1. FileSearchTool
    fst = FileSearchTool()
    files = fst.search_files("Scholarship requirements")
    assert isinstance(files, list)

    # 2. RAGTool
    rt = RAGTool()
    chunks = rt.retrieve_chunks("attendance threshold", limit=2)
    assert isinstance(chunks, list)

    # 3. DataAnalysisTool
    dat = DataAnalysisTool()
    dat_res = dat.run_analysis("result = 10 * 5")
    assert dat_res["success"] is True

    # 4. ReportTool
    rpt = ReportTool()
    rep_res = rpt.format_output(
        title="Test Brief",
        query="Test query",
        content="Test content",
        citations=[{"document": "doc.pdf", "page": 1}]
    )
    assert "report_markdown" in rep_res


def test_citation_consolidation_and_clean_response():
    # Multiple chunks from same doc & page
    chunks = [
        {"document": "AI_Sign_Language_Assistant_Project_Synopsis.docx", "document_id": "d1", "page": 1, "chunk_id": "c1", "evidence": "Abstract: Real-time dual-hand tracking."},
        {"document": "AI_Sign_Language_Assistant_Project_Synopsis.docx", "document_id": "d1", "page": 1, "chunk_id": "c2", "evidence": "Features: Continuous gesture translation and AI avatar."}
    ]
    res = ResponseAgent.generate_response(
        query="Explain the AI sign language project.",
        retrieved_context=chunks,
        verification_results={"is_fully_supported": True}
    )

    final_resp = res["final_response"]
    # Check that raw RAG chunk dumping format is NOT present
    assert "Based on the uploaded document evidence:" not in final_resp
    assert "Abstract: Real-time dual-hand tracking." in final_resp or "AI" in final_resp

    # Check consolidated sources format
    assert "AI_Sign_Language_Assistant_Project_Synopsis.docx — Page 1" in final_resp
    assert "consolidated_sources" in res
    assert len(res["consolidated_sources"]) == 1


def test_email_tool_drafting():
    from backend.tools.email_tool import EmailTool

    draft = EmailTool.draft_email("Reply accepting the event invitation to organizer@example.com")
    assert "recipient" in draft
    assert draft["recipient"] == "organizer@example.com"
    assert "subject" in draft
    assert "body" in draft
    assert draft["status"] == "drafted"
    assert draft["requires_user_approval"] is False


def test_email_send_vs_draft_intent_classification():
    from backend.agents.query_analyzer import QueryAnalyzerAgent

    # 1. SEND command
    res_send = QueryAnalyzerAgent.analyze("Send an email to test@example.com accepting the invitation.")
    assert res_send["requires_email"] is True
    assert res_send["email_action"] == "SEND"

    # 2. DRAFT command ("Write an email..." -> DRAFT per spec section 6)
    res_draft = QueryAnalyzerAgent.analyze("Write an email to test@example.com accepting the invitation.")
    assert res_draft["requires_email"] is True
    assert res_draft["email_action"] == "DRAFT"

    # 3. Prompt injection: context inside prompt should NOT set SEND if user query is summarize
    res_summary = QueryAnalyzerAgent.analyze("Summarize this email.")
    assert res_summary["requires_email"] is False
    assert res_summary["email_action"] is None


def test_explicit_send_and_authorization_failure():
    from backend.agents.email_agent import EmailAgent
    from backend.tools.email_tool import EmailTool
    from unittest.mock import patch

    send_query = "Send this to test@example.com: Thank you for the invitation."
    
    # 1. Authorization failure when access_token is missing (No false success)
    res_no_token = EmailAgent.run(send_query, access_token=None, email_action="SEND")
    assert res_no_token["status"] == "failed"
    assert "authorization required" in res_no_token["error"].lower()

    # 2. Successful delivery when valid access_token is present
    mock_sent_response = {
        "status": "sent",
        "recipient": "test@example.com",
        "subject": "Re: Showcase Invitation",
        "body": "Dear Sir/Madam,\n\nThank you for the invitation.",
        "sent_at": "2026-09-17T11:20:00",
        "message_id": "msg_valid_oauth_123"
    }
    with patch.object(EmailTool, 'send_email', return_value=mock_sent_response):
        res_sent = EmailAgent.run(send_query, access_token="ya29_valid_token_abc", email_action="SEND")
        assert res_sent["status"] == "sent"
        assert res_sent["recipient"] == "test@example.com"
        assert res_sent["message_id"] == "msg_valid_oauth_123"


def test_missing_recipient_clarification():
    from backend.agents.email_agent import EmailAgent

    # Missing Recipient test (Section 7)
    res_missing_recip = EmailAgent.run("Send this email: I accept the invitation.", email_action="SEND")
    assert res_missing_recip["status"] == "clarify"
    assert res_missing_recip["missing_field"] == "recipient"
    assert res_missing_recip["clarification_prompt"] == "Who should I send it to?"


def test_missing_content_clarification():
    from backend.agents.email_agent import EmailAgent

    # Missing Content test (Section 8)
    res_missing_content = EmailAgent.run("Send an email to test@example.com", email_action="SEND")
    assert res_missing_content["status"] == "clarify"
    assert res_missing_content["missing_field"] == "content"
    assert res_missing_content["clarification_prompt"] == "What would you like me to send?"


def test_multi_turn_send_flow():
    from backend.agents.email_agent import EmailAgent

    # Multi-turn test (Section 15)
    history = [
        {"role": "user", "content": "Write a reply to this email."},
        {"role": "assistant", "content": "### Email Draft Generated\n\n**To:** `organizer@example.com`\n**Subject:** Re: Invitation\n\n**Message Body:**\nDear Organizer,\n\nI am happy to accept the showcase invitation.\n\nBest regards,\nMukesh"}
    ]
    
    # Turn 2: User commands "Send it to test@example.com."
    res_turn2 = EmailAgent.run(
        query="Send it to test@example.com.",
        access_token="ya29_mock_token",
        email_action="SEND",
        conversation_history=history
    )
    # Checks that recipient is test@example.com and body was extracted from Turn 1 draft
    assert res_turn2["recipient"] == "test@example.com"
    assert "accept the showcase invitation" in res_turn2["body"]


def test_dummy_mail_and_create_mail():
    from backend.agents.query_analyzer import QueryAnalyzerAgent
    from backend.agents.email_agent import EmailAgent
    from backend.tools.email_tool import EmailTool
    from unittest.mock import patch

    # 1. Test "send a dummy mail to palanimukesh422@gmail.com"
    analysis = QueryAnalyzerAgent.analyze("send a dummy mail to palanimukesh422@gmail.com")
    assert analysis["requires_email"] is True
    assert analysis["email_action"] == "SEND"

    mock_sent_response = {
        "status": "sent",
        "recipient": "palanimukesh422@gmail.com",
        "subject": "Dummy Mail",
        "body": "This is a dummy email.",
        "sent_at": "2026-09-17T12:00:00",
        "message_id": "msg_dummy_123"
    }
    with patch.object(EmailTool, 'send_email', return_value=mock_sent_response):
        res = EmailAgent.run("send a dummy mail to palanimukesh422@gmail.com", access_token="ya29_valid_token", email_action="SEND")
        assert res["status"] == "sent"
        assert res["recipient"] == "palanimukesh422@gmail.com"

    # 2. Test "create dummy mail"
    analysis_create = QueryAnalyzerAgent.analyze("create dummy mail")
    assert analysis_create["requires_email"] is True
    assert analysis_create["email_action"] == "DRAFT"


def test_fresh_query_does_not_use_stale_history_draft():
    from backend.tools.email_tool import EmailTool
    from unittest.mock import patch

    # Stale history containing an old Showcase Invitation draft
    stale_history = [
        {"role": "user", "content": "Write a reply to the showcase invitation."},
        {"role": "assistant", "content": "### Email Draft Generated\n\n**To:** `organizer@example.com`\n**Subject:** Re: Project Showcase Invitation\n\n**Message Body:**\nDear Sir/Madam,\n\nThank you for the invitation to the project showcase. I am pleased to accept..."}
    ]

    # User enters a NEW directive: "send love proposal to deepakashok720@gmail.com"
    mock_draft_response = {
        "recipient": "deepakashok720@gmail.com",
        "subject": "Expression of Feelings",
        "body": "Dear Deepak,\n\nI wanted to share that you are very special to me...",
        "reasoning": "New message drafted based on user request."
    }

    mock_sent_response = {
        "status": "sent",
        "recipient": "deepakashok720@gmail.com",
        "subject": "Expression of Feelings",
        "body": "Dear Deepak,\n\nI wanted to share that you are very special to me...",
        "sent_at": "2026-09-17T12:00:00",
        "message_id": "msg_fresh_123"
    }

    with patch.object(EmailTool, 'draft_email', return_value=mock_draft_response):
        with patch.object(EmailTool, 'send_email', return_value=mock_sent_response):
            res = EmailTool.process_email_request(
                query="send love proposal to deepakashok720@gmail.com",
                access_token="ya29_valid_token",
                email_action="SEND",
                conversation_history=stale_history
            )
            # Verify that the NEW subject & body are used, NOT the stale Project Showcase Invitation!
            assert res["subject"] == "Expression of Feelings"
            assert "Deepak" in res["body"]
            assert "Project Showcase Invitation" not in res["subject"]
            assert "Project Showcase Invitation" not in res["body"]


def test_past_tense_sent_this_to_recognition():
    from backend.agents.query_analyzer import QueryAnalyzerAgent

    query = "Hey, I've been wanting to tell you something... ❤️ sent this to deepakashok720@gmail.com"
    analysis = QueryAnalyzerAgent.analyze(query)
    assert analysis["requires_email"] is True
    assert analysis["email_action"] == "SEND"








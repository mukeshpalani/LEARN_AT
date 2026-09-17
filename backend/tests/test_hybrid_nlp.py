import pytest
from backend.nlp import HybridNLPEngine, ActionType, MessagePurpose, ContextDependency
from backend.tools.email_tool import EmailTool


def test_scenario_1_independent_love_proposal():
    """Test 1: Send a love proposal to person@example.com (Independent request)"""
    query = "Send a love proposal to person@example.com"
    intent = HybridNLPEngine.process(query)
    
    assert intent.action == ActionType.SEND_EMAIL
    assert intent.message_purpose == MessagePurpose.ROMANTIC_PROPOSAL
    assert intent.recipient == "person@example.com"
    assert intent.reuse_previous_email is False


def test_scenario_2_thank_you_email():
    """Test 2: Send a thank-you email to person@example.com"""
    query = "Send a thank-you email to person@example.com"
    intent = HybridNLPEngine.process(query)
    
    assert intent.action == ActionType.SEND_EMAIL
    assert intent.message_purpose == MessagePurpose.THANK_YOU
    assert intent.recipient == "person@example.com"


def test_scenario_3_project_acceptance_email():
    """Test 3: Send an email accepting the project invitation to person@example.com"""
    query = "Send an email accepting the project invitation to person@example.com"
    intent = HybridNLPEngine.process(query)
    
    assert intent.action == ActionType.SEND_EMAIL
    assert intent.message_purpose == MessagePurpose.ACCEPTANCE
    assert intent.recipient == "person@example.com"


def test_scenario_4_contamination_prevention_love_proposal():
    """
    Test 4: Crucial Context Contamination Fix
    Previous turn: Write a project acceptance email.
    Current turn: Send a love proposal to depakashok720@gmail.com
    Expected: NEW_TASK, reuse_previous_email = False, and NO project acceptance text in body.
    """
    history = [
        {"role": "user", "content": "Write a project showcase acceptance email."},
        {"role": "assistant", "content": "**Subject:** Project Showcase Acceptance\n\n**Message Body:**\nDear Organizer,\n\nI am delighted to accept your invitation to the Project Showcase.\n\nBest regards,\nMukesh"}
    ]
    query = "send a love proposal to depakashok720@gmail.com"
    
    intent = HybridNLPEngine.process(query, conversation_history=history)
    
    assert intent.action == ActionType.SEND_EMAIL
    assert intent.message_purpose == MessagePurpose.ROMANTIC_PROPOSAL
    assert intent.recipient == "depakashok720@gmail.com"
    assert intent.context_dependency == ContextDependency.NEW_TASK
    assert intent.reuse_previous_email is False

    res = EmailTool.process_email_request(
        query=query,
        conversation_history=history,
        structured_intent=intent.to_dict()
    )
    
    assert res["status"] in ["drafted", "failed", "sent"]
    assert "project showcase" not in res["body"].lower()
    assert "acceptance" not in res["body"].lower()


def test_scenario_5_explicit_continuation():
    """
    Test 5: Explicit Continuation
    Previous turn: Write a project acceptance email.
    Current turn: Send it to person@example.com
    Expected: CONTINUATION, reuse_previous_email = True, reuses previous draft.
    """
    history = [
        {"role": "user", "content": "Write a project showcase acceptance email."},
        {"role": "assistant", "content": "**Subject:** Project Showcase Acceptance\n\n**Message Body:**\nDear Organizer,\n\nI am delighted to accept your invitation to the Project Showcase.\n\nBest regards,\nMukesh"}
    ]
    query = "Send it to person@example.com"
    
    intent = HybridNLPEngine.process(query, conversation_history=history)
    
    assert intent.action == ActionType.SEND_EMAIL
    assert intent.recipient == "person@example.com"
    assert intent.context_dependency == ContextDependency.CONTINUATION
    assert intent.reuse_previous_email is True

    res = EmailTool.process_email_request(
        query=query,
        conversation_history=history,
        structured_intent=intent.to_dict()
    )
    
    assert res["status"] in ["drafted", "failed", "sent"]
    assert "project showcase" in res["body"].lower() or "delighted to accept" in res["body"].lower()


def test_scenario_6_missing_content_clarification():
    """Test 6: Send this to person@example.com without active draft -> CLARIFY content"""
    query = "Send this to person@example.com"
    intent = HybridNLPEngine.process(query)
    
    res = EmailTool.process_email_request(
        query=query,
        conversation_history=[],
        structured_intent=intent.to_dict()
    )
    
    assert res["status"] == "clarify"
    assert res["missing_field"] == "content"


# --- Section 25 Test Matrix ---

def test_matrix_scenario_1_love_proposal():
    query = "send a love proposal to test@example.com"
    intent = HybridNLPEngine.process(query)
    assert intent.message_purpose == MessagePurpose.ROMANTIC_PROPOSAL
    assert intent.reuse_previous_email is False


def test_matrix_scenario_2_business_proposal():
    query = "send a business proposal to test@example.com"
    intent = HybridNLPEngine.process(query)
    assert intent.message_purpose == MessagePurpose.BUSINESS_PROPOSAL
    assert intent.reuse_previous_email is False


def test_matrix_scenario_3_dummy_mail():
    query = "send a dummy mail to test@example.com"
    intent = HybridNLPEngine.process(query)
    assert intent.message_purpose == MessagePurpose.GENERIC_EMAIL
    assert intent.reuse_previous_email is False


def test_matrix_scenario_4_thank_you():
    query = "send a thank-you email to test@example.com"
    intent = HybridNLPEngine.process(query)
    assert intent.message_purpose == MessagePurpose.THANK_YOU
    assert intent.reuse_previous_email is False


def test_matrix_scenario_5_project_acceptance():
    query = "send a project acceptance email to test@example.com"
    intent = HybridNLPEngine.process(query)
    assert intent.message_purpose == MessagePurpose.ACCEPTANCE
    assert intent.reuse_previous_email is False


def test_matrix_scenario_6_send_it_with_history():
    history = [
        {"role": "user", "content": "Write a business proposal."},
        {"role": "assistant", "content": "Subject: Business Proposal\n\nDear Partner,\n\nWe propose a strategic collaboration..."}
    ]
    query = "send it to test@example.com"
    intent = HybridNLPEngine.process(query, conversation_history=history)
    assert intent.reuse_previous_email is True
    assert intent.context_dependency == ContextDependency.CONTINUATION


def test_matrix_scenario_7_send_previous_draft():
    history = [
        {"role": "user", "content": "Write a business proposal."},
        {"role": "assistant", "content": "Subject: Business Proposal\n\nDear Partner,\n\nWe propose a strategic collaboration..."}
    ]
    query = "send the previous draft to test@example.com"
    intent = HybridNLPEngine.process(query, conversation_history=history)
    assert intent.reuse_previous_email is True
    assert intent.context_dependency == ContextDependency.CONTINUATION


def test_matrix_scenario_8_send_different_email():
    history = [
        {"role": "user", "content": "Write a love proposal."},
        {"role": "assistant", "content": "Subject: A Special Message\n\nDear Mukesh, I wanted to take a moment..."}
    ]
    query = "send a different email to test@example.com"
    intent = HybridNLPEngine.process(query, conversation_history=history)
    assert intent.reuse_previous_email is False
    assert intent.context_dependency == ContextDependency.NEW_TASK


# --- Section 26 Critical 5-Step Regression Sequence ---

def test_critical_5_step_regression_sequence():
    """
    Executes the exact 5-step sequence from Section 26 of the user request:
    1. send a love proposal to test@example.com
    2. send a business proposal to test@example.com
    3. send a dummy mail to test@example.com
    4. send a thank-you email to test@example.com
    5. send it to test@example.com
    
    Verifies that romantic content NEVER leaks into requests 2, 3, or 4!
    """
    history = []

    # Step 1: send a love proposal to test@example.com
    q1 = "send a love proposal to test@example.com"
    intent1 = HybridNLPEngine.process(q1, conversation_history=history)
    assert intent1.message_purpose == MessagePurpose.ROMANTIC_PROPOSAL
    assert intent1.reuse_previous_email is False
    res1 = EmailTool.process_email_request(q1, conversation_history=history, structured_intent=intent1.to_dict())
    assert res1["status"] in ["drafted", "failed", "sent"]
    history.append({"role": "user", "content": q1})
    history.append({"role": "assistant", "content": f"Subject: {res1.get('subject', 'Love Proposal')}\n\n{res1.get('body', '')}"})

    # Step 2: send a business proposal to test@example.com
    q2 = "send a business proposal to test@example.com"
    intent2 = HybridNLPEngine.process(q2, conversation_history=history)
    assert intent2.message_purpose == MessagePurpose.BUSINESS_PROPOSAL
    assert intent2.reuse_previous_email is False
    res2 = EmailTool.process_email_request(q2, conversation_history=history, structured_intent=intent2.to_dict())
    assert res2["status"] in ["drafted", "failed", "sent"]
    # CRITICAL VERIFICATION: No romantic content in business proposal!
    body2_lower = res2["body"].lower()
    assert "heart" not in body2_lower
    assert "walk this journey" not in body2_lower
    assert "with all my love" not in body2_lower
    assert "business" in body2_lower or "proposal" in body2_lower or "collaboration" in body2_lower
    history.append({"role": "user", "content": q2})
    history.append({"role": "assistant", "content": f"Subject: {res2.get('subject', 'Business Proposal')}\n\n{res2.get('body', '')}"})

    # Step 3: send a dummy mail to test@example.com
    q3 = "send a dummy mail to test@example.com"
    intent3 = HybridNLPEngine.process(q3, conversation_history=history)
    assert intent3.message_purpose == MessagePurpose.GENERIC_EMAIL
    assert intent3.reuse_previous_email is False
    res3 = EmailTool.process_email_request(q3, conversation_history=history, structured_intent=intent3.to_dict())
    assert res3["status"] in ["drafted", "failed", "sent"]
    # CRITICAL VERIFICATION: No romantic content in dummy mail!
    body3_lower = res3["body"].lower()
    assert "heart" not in body3_lower
    assert "walk this journey" not in body3_lower
    assert "with all my love" not in body3_lower
    history.append({"role": "user", "content": q3})
    history.append({"role": "assistant", "content": f"Subject: {res3.get('subject', 'Dummy Email')}\n\n{res3.get('body', '')}"})

    # Step 4: send a thank-you email to test@example.com
    q4 = "send a thank-you email to test@example.com"
    intent4 = HybridNLPEngine.process(q4, conversation_history=history)
    assert intent4.message_purpose == MessagePurpose.THANK_YOU
    assert intent4.reuse_previous_email is False
    res4 = EmailTool.process_email_request(q4, conversation_history=history, structured_intent=intent4.to_dict())
    assert res4["status"] in ["drafted", "failed", "sent"]
    # CRITICAL VERIFICATION: No romantic content in thank-you email!
    body4_lower = res4["body"].lower()
    assert "heart" not in body4_lower
    assert "walk this journey" not in body4_lower
    assert "thank" in body4_lower or "appreciation" in body4_lower
    history.append({"role": "user", "content": q4})
    history.append({"role": "assistant", "content": f"Subject: {res4.get('subject', 'Thank You')}\n\n{res4.get('body', '')}"})

    # Step 5: send it to test@example.com
    q5 = "send it to test@example.com"
    intent5 = HybridNLPEngine.process(q5, conversation_history=history)
    assert intent5.reuse_previous_email is True
    assert intent5.context_dependency == ContextDependency.CONTINUATION
    res5 = EmailTool.process_email_request(q5, conversation_history=history, structured_intent=intent5.to_dict())
    # Should reuse immediately previous draft (Step 4 thank-you email), NOT Step 1 romantic email!
    body5_lower = res5["body"].lower()
    assert "heart" not in body5_lower
    assert "walk this journey" not in body5_lower


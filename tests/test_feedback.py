"""
Unit Tests for Feedback API

This file contains test cases for the feedback API endpoints.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_context_feedback_flag():
    """
    Test the /context-feedback endpoint for flagging a context.
    """
    response = client.post("/api/context-feedback", json={
        "context_id": "thread123",
        "action": "flag"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Context thread123 flagged successfully."

def test_context_feedback_approve():
    """
    Test the /context-feedback endpoint for approving a context.
    """
    response = client.post("/api/context-feedback", json={
        "context_id": "thread123",
        "action": "approve"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Context thread123 approved successfully."

def test_context_feedback_invalid_action():
    """
    Test the /context-feedback endpoint with an invalid action.
    """
    response = client.post("/api/context-feedback", json={
        "context_id": "thread123",
        "action": "invalid_action"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid action. Must be 'flag' or 'approve'."

"""
Unit Tests for Context Retrieval

This file contains test cases for the context retrieval API.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_retrieve_context():
    """
    Test the /retrieve-context endpoint.
    """
    response = client.post("/api/retrieve-context", json={"query": "example"})
    assert response.status_code == 200
    assert "results" in response.json()

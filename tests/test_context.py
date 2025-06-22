"""
Unit Tests for Context Retrieval

This file contains test cases for the context retrieval API.
"""

import pytest


def test_retrieve_context(client):
    """Test the /retrieve-context endpoint with default filters."""
    response = client.post("/api/retrieve-context", json={"query": "example"})
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert data["results"][0]["thread_id"] == 1


def test_retrieve_context_filtered(client):
    """Test filtering by approvals and hiding flagged threads."""
    payload = {"query": "example", "min_approvals": 1, "hide_flagged": True}
    response = client.post("/api/retrieve-context", json=payload)
    assert response.status_code == 200
    results = response.json()["results"]
    assert results  # Should not be empty
    for item in results:
        assert item["approvals"] >= 1
        assert item["flags"] == 0

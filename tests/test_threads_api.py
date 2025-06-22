"""Integration tests for thread and comment endpoints."""

from backend.database import database, comments
import pytest


def test_category_thread_comment_flow(client):
    # Create category
    resp = client.post("/api/categories", json={"name": "TestCat", "description": "d"})
    assert resp.status_code == 200
    cat_id = resp.json()["id"]

    # Create thread
    thread_payload = {"title": "Thread1", "category_id": cat_id, "description": "t"}
    resp = client.post("/api/threads", json=thread_payload)
    assert resp.status_code == 200
    data = resp.json()
    thread_id = data["id"]
    root_comment_id = data["root_comment_id"]

    # Fetch threads in category
    resp = client.get(f"/api/categories/{cat_id}/threads")
    assert resp.status_code == 200
    assert any(t["id"] == thread_id for t in resp.json())

    # Add a comment
    comment_payload = {"text": "Hello", "parent_id": root_comment_id}
    resp = client.post(f"/api/threads/{thread_id}/comments", json=comment_payload)
    assert resp.status_code == 200
    comment_id = resp.json()["id"]

    # Get comments
    resp = client.get(f"/api/threads/{thread_id}/comments")
    assert resp.status_code == 200
    assert any(c["id"] == comment_id for c in resp.json())

    # Hide the comment
    resp = client.post(f"/api/comments/{comment_id}/action", json={"action": "hide"})
    assert resp.status_code == 200
    assert resp.json()["message"] == "Comment hidden successfully."

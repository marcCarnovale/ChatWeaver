# tests/test_embeddings.py

"""
Unit Tests for Embeddings

This file contains test cases for the embeddings module.
"""

import asyncio
from embeddings.vector_db import VectorDB
from backend.database import feedback, database, init_db, save_context
import pytest

@pytest.fixture(scope="module")
async def vector_db_fixture():
    vector_db = VectorDB()
    await vector_db.initialize()
    yield vector_db
    # Cleanup if necessary
    # For example, remove test entries from the database
    await database.execute(
        feedback.delete().where(feedback.c.context_id == "thread_test_1")
    )
    # Optionally, remove the conversation and mapping
    await database.execute(
        database.contexts.delete().where(database.contexts.c.thread_id == "thread_test_1")
    )
    # Note: Removing from FAISS index is non-trivial; consider using a separate test index
    # or rebuilding the index after tests

@pytest.fixture(scope="module", autouse=True)
async def setup_db_fixture():
    await init_db()
    yield
    await database.disconnect()

@pytest.mark.asyncio
async def test_add_and_search_embeddings(vector_db_fixture):
    """
    Test adding embeddings to the index and searching for them.
    """
    # Add a conversation
    thread_id = "thread_test_1"
    text = "This is a test conversation about AI."
    await vector_db_fixture.index_conversation(thread_id, text)
    
    # Add feedback to influence retrieval
    await database.execute(
        feedback.insert().values(
            context_id=thread_id,
            flags=0,
            approvals=1
        )
    )
    
    # Search embeddings
    results = await vector_db_fixture.search_embeddings("Tell me about AI.", k=1)
    assert len(results) == 1
    assert results[0]["thread_id"] == thread_id
    assert results[0]["text"] == text
    assert results[0]["approvals"] == 1
    assert results[0]["flags"] == 0

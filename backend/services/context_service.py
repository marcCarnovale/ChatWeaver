# backend/services/context_service.py

from typing import List, Dict
from backend.database import database, threads
from embeddings.retrieval.context_retrieval import retrieve_relevant_threads
from embeddings.vector_db import VectorDB
import json

async def retrieve_threads(vector_db: VectorDB, query: str, min_approvals: int, hide_flagged: bool, k: int = 5) -> List[Dict]:
    """
    Retrieves relevant threads based on query and filters.

    Args:
        vector_db (VectorDB): The VectorDB instance for searching.
        query (str): User's input query.
        min_approvals (int): Minimum approval count for a context to be included.
        hide_flagged (bool): Exclude flagged threads if True.
        k (int): Number of top results to retrieve from embeddings.

    Returns:
        List[Dict]: Filtered and sorted threads.
    """
    # Step 1: Retrieve relevant threads using embeddings with feedback adjustments
    relevant_threads = await retrieve_relevant_threads(vector_db, query, k)

    # Step 2: Apply additional filters based on min_approvals and hide_flagged
    filtered_threads = []
    for context in relevant_threads:
        flags = context["flags"]
        approvals = context["approvals"]

        if hide_flagged and flags > 0:
            continue
        if approvals < min_approvals:
            continue

        # Add context with metadata
        filtered_threads.append({
            "thread_id": context["thread_id"],
            "text": context["text"],
            "flags": flags,
            "approvals": approvals,
        })

    # Step 3: Sort the filtered threads by net score (approvals - flags)
    filtered_threads.sort(key=lambda x: x["approvals"] - x["flags"], reverse=True)

    return filtered_threads

async def save_conversation(vector_db: VectorDB, conversation: dict):
    """
    Save a parsed conversation into the database and index it in the embeddings.

    Args:
        vector_db (VectorDB): The VectorDB instance for indexing.
        conversation (dict): Parsed conversation data.
    """
    # Save to database
    await database.execute(
        threads.insert().values(
            thread_id=conversation["conversation_id"],
            text=json.dumps(conversation["nodes"])  # Assuming 'nodes' contain messages
        )
    )

    # Index in embeddings
    for node in conversation["nodes"]:
        if node["role"] in ["user", "assistant"]:
            await vector_db.index_conversation(conversation["conversation_id"], node["content"])

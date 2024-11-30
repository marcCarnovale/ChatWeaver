# backend/services/context_service.py

from typing import List, Dict
from backend.database import database, contexts
from embeddings.retrieval.context_retrieval import retrieve_relevant_contexts
from embeddings.vector_db import VectorDB
import json

async def retrieve_contexts(vector_db: VectorDB, query: str, min_approvals: int, hide_flagged: bool, k: int = 5) -> List[Dict]:
    """
    Retrieves relevant contexts based on query and filters.

    Args:
        vector_db (VectorDB): The VectorDB instance for searching.
        query (str): User's input query.
        min_approvals (int): Minimum approval count for a context to be included.
        hide_flagged (bool): Exclude flagged contexts if True.
        k (int): Number of top results to retrieve from embeddings.

    Returns:
        List[Dict]: Filtered and sorted contexts.
    """
    # Step 1: Retrieve relevant contexts using embeddings with feedback adjustments
    relevant_contexts = await retrieve_relevant_contexts(vector_db, query, k)

    # Step 2: Apply additional filters based on min_approvals and hide_flagged
    filtered_contexts = []
    for context in relevant_contexts:
        flags = context["flags"]
        approvals = context["approvals"]

        if hide_flagged and flags > 0:
            continue
        if approvals < min_approvals:
            continue

        # Add context with metadata
        filtered_contexts.append({
            "thread_id": context["thread_id"],
            "text": context["text"],
            "flags": flags,
            "approvals": approvals,
        })

    # Step 3: Sort the filtered contexts by net score (approvals - flags)
    filtered_contexts.sort(key=lambda x: x["approvals"] - x["flags"], reverse=True)

    return filtered_contexts

async def save_conversation(vector_db: VectorDB, conversation: dict):
    """
    Save a parsed conversation into the database and index it in the embeddings.

    Args:
        vector_db (VectorDB): The VectorDB instance for indexing.
        conversation (dict): Parsed conversation data.
    """
    # Save to database
    await database.execute(
        contexts.insert().values(
            thread_id=conversation["conversation_id"],
            text=json.dumps(conversation["nodes"])  # Assuming 'nodes' contain messages
        )
    )

    # Index in embeddings
    for node in conversation["nodes"]:
        if node["role"] in ["user", "assistant"]:
            await vector_db.index_conversation(conversation["conversation_id"], node["content"])

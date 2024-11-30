# embeddings/retrieval/context_retrieval.py

"""
Context Retrieval Logic

This module implements logic for retrieving relevant contexts based on user queries.
"""

from typing import List, Dict
from embeddings.vector_db import VectorDB

async def retrieve_relevant_contexts(vector_db: VectorDB, query: str, k: int = 5) -> List[Dict]:
    """
    Retrieve the most relevant contexts for a given query.

    Args:
        vector_db (VectorDB): The VectorDB instance to use for searching.
        query (str): User's input query.
        k (int): Number of top results to retrieve.

    Returns:
        List[Dict]: List of retrieved contexts with metadata.
    """
    return await vector_db.search_embeddings(query, k)

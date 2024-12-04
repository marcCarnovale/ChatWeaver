# embeddings/retrieval/context_retrieval.py

"""
Context Retrieval Logic

This module implements logic for retrieving relevant threads based on user queries.
"""

from typing import List, Dict
from embeddings.vector_db import VectorDB

async def retrieve_relevant_threads(vector_db: VectorDB, query: str, k: int = 5) -> List[Dict]:
    """
    Retrieve the most relevant threads for a given query.

    Args:
        vector_db (VectorDB): The VectorDB instance to use for searching.
        query (str): User's input query.
        k (int): Number of top results to retrieve.

    Returns:
        List[Dict]: List of retrieved threads with metadata.
    """
    return await vector_db.search_embeddings(query, k)

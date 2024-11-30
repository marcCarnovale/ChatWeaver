"""
Embedding Manager

This module handles embedding generation and indexing logic for ThreadChat.
"""

from embeddings.vector_db import add_to_index
from concurrent.futures import ProcessPoolExecutor
import asyncio

# Initialize a global executor if not already
executor = None

def initialize_executor():
    global executor
    if executor is None:
        executor = ProcessPoolExecutor()

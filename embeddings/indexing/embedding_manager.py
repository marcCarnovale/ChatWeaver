"""
Embedding Manager

This module handles embedding generation and indexing logic for Chatweaver.
"""

from concurrent.futures import ProcessPoolExecutor

# Initialize a global executor if not already
executor = None

def initialize_executor():
    global executor
    if executor is None:
        executor = ProcessPoolExecutor()

# backend/dependencies.py

from embeddings.vector_db import VectorDB

# Create a global VectorDB instance
vector_db = VectorDB()

def get_vector_db() -> VectorDB:
    return vector_db

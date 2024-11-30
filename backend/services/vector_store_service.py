# backend/services/vector_store_service.py

from openai import OpenAI
import faiss
import numpy as np
import os
import logging

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

# Initialize FAISS index
embedding_dimension = 1536  # For OpenAI's text-embedding-ada-002
index = faiss.IndexFlatL2(embedding_dimension)

def add_to_faiss(text):
    """
    Add text embeddings to FAISS index.
    """
    try:
        embedding_response = client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        embedding = embedding_response.choices[0].embedding
        embedding_np = np.array(embedding).astype('float32')
        index.add(np.expand_dims(embedding_np, axis=0))
        logging.info("Added embedding to FAISS index.")
    except Exception as e:
        logging.error(f"Error adding to FAISS: {e}")

def search_faiss(query, top_k=5):
    """
    Search FAISS index for similar texts.
    
    Args:
        query (str): The search query.
        top_k (int): Number of top similar results to return.
    
    Returns:
        list of int: Indices of the top similar embeddings.
    """
    try:
        embedding_response = client.embeddings.create(
            input=query,
            model="text-embedding-ada-002"
        )
        embedding = embedding_response.choices[0].embedding
        embedding_np = np.array(embedding).astype('float32')
        distances, indices = index.search(np.expand_dims(embedding_np, axis=0), top_k)
        logging.info("FAISS search completed.")
        return indices[0].tolist()
    except Exception as e:
        logging.error(f"Error searching FAISS: {e}")
        return []

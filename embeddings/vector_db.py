# embeddings/vector_db.py

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os
from typing import List, Dict, Optional
import logging

from backend.database import database, embedding_mapping, threads, feedback
from backend.services.executor import executor  # Centralized executor
from sqlalchemy import select
import asyncio

# Configuration
INDEX_FILE = "faiss_index.bin"
DIMENSIONS = 384  # Example dimensionality for 'all-MiniLM-L6-v2' model
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

class VectorDB:
    def __init__(self):
        self.embedding_index_to_thread: Dict[int, str] = {}
        self.index: Optional[faiss.Index] = None
        self.embedding_model: Optional[SentenceTransformer] = None

    async def initialize(self):
        """
        Initialize the embedding model, FAISS index, and load existing mappings.
        """
        logging.info("Initializing VectorDB...")
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        logging.info(f"Initialized embedding model: {EMBEDDING_MODEL_NAME}")

        # Initialize FAISS index
        if os.path.exists(INDEX_FILE):
            self.index = faiss.read_index(INDEX_FILE)
            logging.info("FAISS index loaded from disk.")
        else:
            self.index = faiss.IndexFlatL2(DIMENSIONS)  # Using L2 distance
            logging.info("Initialized new FAISS index.")

        # Load existing embedding mappings from the database
        self.embedding_index_to_thread = await self.load_embedding_mapping()
        logging.info(f"Loaded {len(self.embedding_index_to_thread)} embedding mappings.")

    async def load_embedding_mapping(self) -> Dict[int, str]:
        """
        Load embedding mappings from the database into a dictionary.
        
        Returns:
            Dict[int, str]: Mapping of FAISS index to thread_id.
        """
        query = select(
            embedding_mapping.c.faiss_index,
            embedding_mapping.c.thread_id
        ).order_by(embedding_mapping.c.faiss_index)
        rows = await database.fetch_all(query)
        return {row["faiss_index"]: row["thread_id"] for row in rows}

    def save_index(self):
        """
        Save the FAISS index to disk.
        """
        if self.index:
            faiss.write_index(self.index, INDEX_FILE)
            logging.info("FAISS index saved to disk.")
        else:
            logging.warning("FAISS index is not initialized. Cannot save.")

    async def add_to_index_bulk(self, thread_ids: List[int], texts: List[str]):
        """
        Asynchronously add multiple embeddings to the FAISS index and update the mapping.

        Args:
            thread_ids (List[str]): List of thread IDs associated with the texts.
            texts (List[str]): List of texts to embed and store.
        """
        if len(thread_ids) != len(texts):
            raise ValueError("The number of thread_ids must match the number of texts.")

        if not self.embedding_model or not self.index:
            raise RuntimeError("VectorDB is not initialized. Call 'initialize' first.")

        # Encode texts to embeddings asynchronously
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(executor, self.embedding_model.encode, texts)
        embeddings = np.array(embeddings, dtype="float32")

        # Add embeddings to FAISS (blocking operation)
        def _add_embeddings(embeddings: np.ndarray):
            self.index.add(embeddings)
            logging.info(f"Added {len(texts)} embeddings to FAISS index.")

        # Offload FAISS add operation to the executor
        await loop.run_in_executor(executor, _add_embeddings, embeddings)

        # Calculate starting index for new embeddings
        current_index = self.index.ntotal - len(texts)

        # Update in-memory mapping
        for i, thread_id in enumerate(thread_ids):
            faiss_idx = current_index + i
            self.embedding_index_to_thread[faiss_idx] = thread_id

        # Update the database with new mappings asynchronously
        async def _update_mapping_db():
            async with database.transaction():
                for i, thread_id in enumerate(thread_ids):
                    faiss_idx = current_index + i
                    insert_query = embedding_mapping.insert().values(
                        faiss_index=faiss_idx,
                        thread_id=thread_id
                    )
                    await database.execute(insert_query)
            logging.info(f"Updated embedding_mapping for {len(thread_ids)} threads.")

        await _update_mapping_db()

        # Save the updated FAISS index
        self.save_index()

    async def search_embeddings(self, query: str, k: int = 5) -> List[Dict]:
        """
        Asynchronously search the FAISS index for the most relevant embeddings
        and adjust scores based on feedback.

        Args:
            query (str): The query to embed and search.
            k (int): Number of top results to return.

        Returns:
            List[Dict]: List of retrieved metadata (thread_id, text, adjusted_distance, flags, approvals).
        """

        if not self.embedding_model or not self.index:
            raise RuntimeError("VectorDB is not initialized. Call 'initialize' first.")

        loop = asyncio.get_event_loop()

        # Encode the query asynchronously
        query_embedding = await loop.run_in_executor(executor, self.embedding_model.encode, [query])
        query_embedding = np.array(query_embedding, dtype="float32")

        # Define a blocking function for FAISS search
        def _search(query_embedding: np.ndarray, k: int):
            distances, indices = self.index.search(query_embedding, k)
            return distances, indices

        # Offload FAISS search to the executor
        distances, indices = await loop.run_in_executor(executor, _search, query_embedding, k)

        results = []
        for distance, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue  # No more results

            thread_id = self.embedding_index_to_thread.get(idx)
            if not thread_id:
                continue  # Mapping not found

            # Fetch context text from the database asynchronously
            query_conversation = select([threads.c.id, threads.c.text]).where(
                threads.c.id == thread_id
            )
            conversation = await database.fetch_one(query_conversation)
            if not conversation:
                continue  # Conversation not found

            # Fetch feedback for this context asynchronously
            query_feedback = select([feedback.c.flags, feedback.c.approvals]).where(
                feedback.c.context_id == thread_id
            )
            feedback_data = await database.fetch_one(query_feedback)

            flags = feedback_data["flags"] if feedback_data else 0
            approvals = feedback_data["approvals"] if feedback_data else 0

            # Adjust scores based on feedback (simple penalty/boost)
            adjusted_distance = distance + (flags * 0.1) - (approvals * 0.05)

            results.append({
                "thread_id": thread_id,
                "text": conversation["text"],
                "adjusted_distance": adjusted_distance,
                "flags": flags,
                "approvals": approvals
            })

        # Sort results by adjusted distance
        sorted_results = sorted(results, key=lambda x: x["adjusted_distance"])

        # Return top k results
        return sorted_results[:k]

    async def index_conversation(self, thread_id: int, text: str) -> Dict:
        """
        Asynchronously index a new conversation by generating and storing its embedding.

        Args:
            thread_id (int): Unique identifier for the conversation.
            text (str): The conversation text to index.

        Returns:
            Dict: Confirmation message.
        """
        await self.add_to_index_bulk([thread_id], [text])
        return {"message": f"Thread {thread_id} indexed successfully."}

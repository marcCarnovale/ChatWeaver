# backend/routes/context.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, TYPE_CHECKING

from backend.services.context_service import retrieve_threads, save_conversation
from backend.services.model_router import get_response
from backend.dependencies import get_vector_db
from embeddings.vector_db import VectorDB

from backend.services.feedback_service import log_feedback, get_feedback_summary
from backend.models import *

import logging

from backend.database import database, comments  # Corrected import to include 'comments'

# Initialize the router
router = APIRouter()

# Pydantic Models

if TYPE_CHECKING:
    CommentResponse.update_forward_refs()

# Endpoint Definitions

@router.post("/retrieve-context")
async def retrieve_context(
    request: RetrieveContextRequest,
    vector_db: VectorDB = Depends(get_vector_db)
):
    """
    Retrieve relevant threads based on the query.
    """
    try:
        retrieved_threads = await retrieve_threads(
            vector_db,
            query=request.query,
            min_approvals=request.min_approvals,
            hide_flagged=request.hide_flagged,
            k=request.k
        )
        return {"results": retrieved_threads}
    except Exception as e:
        logging.error(f"Error in retrieve_context: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.post("/generate-response")
async def generate_response(request: GenerateResponseRequest):
    """
    Generate a response using the specified model.
    """
    try:
        # Generate the response using the specified model
        response_text = get_response(request.query, request.model_type, request.model_name)

        return {"response": response_text}
    except ValueError as e:
        logging.error(f"ValueError in generate_response: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error in generate_response: {e}")
        raise HTTPException(status_code=500, detail="Error generating response.")

@router.post("/create-comment", response_model=CommentResponse)
async def create_comment(request: CreateCommentRequest):
    """
    Create a new comment, optionally as a reply to an existing comment.
    """
    try:
        logging.info(f"Creating comment in thread_id: {request.thread_id}, parent_id: {request.parent_id}")

        # Save the comment to the comments table
        query = comments.insert().values(
            thread_id=request.thread_id,
            parent_id=request.parent_id,
            text=request.text,
            flags=0,
            approvals=0
        )
        comment_id = await database.execute(query)
        logging.info(f"Comment created with id: {comment_id}")

        # Fetch the created comment
        created_comment = await database.fetch_one(
            comments.select().where(comments.c.id == comment_id)
        )

        if not created_comment:
            logging.error("Failed to fetch the created comment.")
            raise HTTPException(status_code=500, detail="Failed to create comment.")

        # Initialize replies
        comment_response = CommentResponse(
            id=created_comment["id"],
            thread_id=created_comment["thread_id"],
            parent_id=created_comment["parent_id"],
            text=created_comment["text"],
            flags=created_comment["flags"],
            approvals=created_comment["approvals"],
            replies=[]
        )

        logging.info(f"Comment response prepared: {comment_response}")
        return comment_response
    except Exception as e:
        logging.error(f"Error creating comment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.get("/get-comments/{thread_id}", response_model=List[CommentResponse])
async def get_comments(thread_id: int):
    """
    Retrieve all comments for a thread in a nested structure.
    """
    try:
        logging.info(f"Retrieving comments for thread_id: {thread_id}")

        # Fetch all comments for the thread from the comments table
        query = comments.select().where(comments.c.thread_id == thread_id).order_by(comments.c.id)
        all_comments = await database.fetch_all(query)
        logging.info(f"Fetched {len(all_comments)} comments from database.")

        # Convert to a dictionary for easy access
        comment_dict = {
            comment["id"]: CommentResponse(
                id=comment["id"],
                thread_id=comment["thread_id"],
                parent_id=comment["parent_id"],
                text=comment["text"],
                flags=comment["flags"],
                approvals=comment["approvals"],
                model_name=comment["model_name"],
                replies=[]
            ) for comment in all_comments
        }

        # Build the tree
        root_comments = []
        for comment in comment_dict.values():
            if comment.parent_id:
                parent = comment_dict.get(comment.parent_id)
                if parent:
                    parent.replies.append(comment)
            else:
                root_comments.append(comment)

        logging.info(f"Built comment tree with {len(root_comments)} root comments.")
        return root_comments
    except Exception as e:
        logging.error(f"Error retrieving comments: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

# Recursive Pydantic Model Configuration
if TYPE_CHECKING:
    CommentResponse.update_forward_refs()

# backend/routes/threads.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.database import database, contexts, comments, embedding_mapping
from backend.services.model_router import get_response
from backend.services.summarization_service import summarize_text
import logging
import asyncio

router = APIRouter()

class ThreadResponse(BaseModel):
    thread_id: str
    name: str
    category_id: int
    description: Optional[str] = None


class CommentResponse(BaseModel):
    id: int
    thread_id: str
    parent_id: Optional[int]
    text: str
    flags: int
    approvals: int
    model_name: Optional[str] = None  # New Field
    replies: List['CommentResponse'] = Field(default_factory=list)
    model_name: Optional[str] = None  # Added model_name

    class Config:
        orm_mode = True

class CommentCreateRequest(BaseModel):
    parent_id: Optional[int] = None
    text: str

class GenerateResponseRequest(BaseModel):
    model_type: str = "openai"  # 'openai' or 'local'
    model_name: str = "gpt-4"    # e.g., 'gpt-4', 'gpt2'

@router.get("/threads/{thread_id}", response_model=ThreadResponse)
async def get_thread(thread_id: str):
    try:
        query = contexts.select().where(contexts.c.thread_id == thread_id)
        thread = await database.fetch_one(query)
        if not thread:
            logging.error(f"Thread with id {thread_id} not found.")
            raise HTTPException(status_code=404, detail="Thread not found.")
        return ThreadResponse(
            thread_id=thread["thread_id"],
            name=thread["text"],
            category_id=thread["category_id"],
            description=None
        )
    except Exception as e:
        logging.error(f"Error fetching thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve thread.")

@router.get("/threads/{thread_id}/comments", response_model=List[CommentResponse])
async def get_comments(thread_id: str):
    try:
        query = comments.select().where(comments.c.thread_id == thread_id).order_by(comments.c.id)
        rows = await database.fetch_all(query)
        return [
            CommentResponse(
                id=row["id"],
                thread_id=row["thread_id"],
                parent_id=row["parent_id"],
                text=row["text"],
                flags=row["flags"],
                approvals=row["approvals"]
            )
            for row in rows
        ]
    except Exception as e:
        logging.error(f"Error fetching comments for thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve comments.")

@router.post("/threads/{thread_id}/comments", response_model=CommentResponse)
async def create_comment(thread_id: str, comment: CommentCreateRequest):
    try:
        # Verify that the thread exists
        thread_query = contexts.select().where(contexts.c.thread_id == thread_id)
        thread = await database.fetch_one(thread_query)
        if not thread:
            logging.error(f"Thread with id {thread_id} not found.")
            raise HTTPException(status_code=404, detail="Thread not found.")
        
        # Insert the comment
        insert_query = comments.insert().values(
            thread_id=thread_id,
            parent_id=comment.parent_id,
            text=comment.text,
            flags=0,
            approvals=0
        )
        comment_id = await database.execute(insert_query)
        
        # Fetch the created comment
        created_comment = await database.fetch_one(comments.select().where(comments.c.id == comment_id))
        return CommentResponse(
            id=created_comment["id"],
            thread_id=created_comment["thread_id"],
            parent_id=created_comment["parent_id"],
            text=created_comment["text"],
            flags=created_comment["flags"],
            approvals=created_comment["approvals"]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Error creating comment in thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create comment.")



@router.post("/threads/{thread_id}/generate-response", response_model=CommentResponse)
async def generate_response(thread_id: str, request: GenerateResponseRequest, parent_comment_id: Optional[int] = None):
    """
    Generate an AI response for a specific thread or comment, utilizing summarization to manage context length.
    """
    try:
        # Verify that the thread exists
        thread_query = contexts.select().where(contexts.c.thread_id == thread_id)
        thread = await database.fetch_one(thread_query)
        if not thread:
            logging.error(f"Thread with id {thread_id} not found.")
            raise HTTPException(status_code=404, detail="Thread not found.")
        
        # Fetch all comments in the thread to build the prompt
        if parent_comment_id:
            # Fetch the specific parent comment
            parent_comment_query = comments.select().where(comments.c.id == parent_comment_id, comments.c.thread_id == thread_id)
            parent_comment = await database.fetch_one(parent_comment_query)
            if not parent_comment:
                logging.error(f"Parent comment with id {parent_comment_id} not found in thread {thread_id}.")
                raise HTTPException(status_code=404, detail="Parent comment not found.")
            
            # Build and summarize the prompt based on the parent comment
            prompt_text = f"User: {parent_comment['text']}\n{parent_comment['model_name'] or 'AI'}:"
            summarized_prompt = summarize_text(prompt_text)
        else:
            # Fetch all comments for the thread
            comments_query = comments.select().where(comments.c.thread_id == thread_id).order_by(comments.c.id)
            thread_comments = await database.fetch_all(comments_query)
            
            if not thread_comments:
                logging.error(f"No comments found in thread {thread_id}.")
                raise HTTPException(status_code=404, detail="No comments available for generating a response.")
            
            # Concatenate all comments
            full_conversation = "\n".join([f"User: {c.text}" if c.parent_id is None else f"{c.model_name or 'AI'}: {c.text}" for c in thread_comments])
            
            # Summarize the conversation to manage prompt length
            summarized_prompt = summarize_text(full_conversation)
        
        # Generate AI response using the specified model
        loop = asyncio.get_event_loop()
        response_text = await loop.run_in_executor(None, get_response, summarized_prompt, request.model_type, request.model_name)
        
        if not response_text.strip():
            logging.error("AI response is empty.")
            raise HTTPException(status_code=500, detail="AI response generation failed.")
        
        # Insert the AI response as a new comment with model_name
        insert_query = comments.insert().values(
            thread_id=thread_id,
            parent_id=parent_comment_id,
            text=response_text,  # Either full text or summarized text
            flags=1,  # Indicates AI-generated comment
            approvals=0,
            model_name=request.model_name,
            hidden=False
        )
        ai_comment_id = await database.execute(insert_query)
        
        # Fetch the AI-generated comment
        ai_comment = await database.fetch_one(comments.select().where(comments.c.id == ai_comment_id))
        
        return CommentResponse(
            id=ai_comment["id"],
            thread_id=ai_comment["thread_id"],
            parent_id=ai_comment["parent_id"],
            text=ai_comment["text"],
            flags=ai_comment["flags"],
            approvals=ai_comment["approvals"],
            model_name=ai_comment["model_name"]  # Include model_name in response
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Error generating AI response for thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI response.")

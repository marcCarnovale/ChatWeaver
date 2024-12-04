# backend/routes/threads.py

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.database import database, threads, comments, embedding_mapping
from backend.services.model_router import get_response
from backend.services.summarization_service import summarize_text_chain
from backend.routes.context import CreateCommentRequest
import logging
import asyncio
from backend.models import *

router = APIRouter()


@router.get("/threads/{thread_id}", response_model=ThreadResponse)
async def get_thread(thread_id: int):
    try:
        query = threads.select().where(threads.c.id == thread_id)
        thread = await database.fetch_one(query)
        if not thread:
            logging.error(f"Thread with id {thread_id} not found.")
            raise HTTPException(status_code=404, detail="Thread not found.")
        return ThreadResponse(
            id=thread["id"],
            title=thread["title"],
            description=thread["description"],
            category_id=thread["category_id"],
            root_comment_id=thread["root_comment_id"]
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
                approvals=row["approvals"],
                model_name=row["model_name"] # Include model_name
            )
            for row in rows
        ]
    except Exception as e:
        logging.error(f"Error fetching comments for thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve comments.")




@router.post("/threads/{thread_id}/comments", response_model=CommentResponse)
async def create_comment(thread_id: int, request: CommentCreateRequest):
    try:
        # Verify that the thread exists
        thread_query = threads.select().where(threads.c.id == thread_id)
        thread = await database.fetch_one(thread_query)
        if not thread:
            logging.error(f"Thread with id {thread_id} not found.")
            raise HTTPException(status_code=404, detail="Thread not found.")

        # Insert the comment
        insert_query = comments.insert().values(
            thread_id=thread_id,
            parent_id=request.parent_id,
            text=request.text,
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
            approvals=created_comment["approvals"],
            model_name=created_comment["model_name"]
        )
    except Exception as e:
        logging.error(f"Error creating comment in thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create comment.")


@router.put("/comments/{comment_id}/overwrite", response_model=CommentResponse)
async def overwrite_comment(comment_id: int, request: CreateCommentRequest):
    """
    Overwrite an existing comment's text, flags, and other metadata.
    """
    try:
        # Verify that the comment exists
        comment_query = comments.select().where(comments.c.id == comment_id)
        existing_comment = await database.fetch_one(comment_query)
        if not existing_comment:
            logging.error(f"Comment with id {comment_id} not found.")
            raise HTTPException(status_code=404, detail="Comment not found.")

        # Update the comment with provided fields
        update_values = {"text": request.text}
        if request.flags is not None:
            update_values["flags"] = request.flags
        if request.model_name is not None:
            update_values["model_name"] = request.model_name

        update_query = comments.update().where(comments.c.id == comment_id).values(**update_values)
        await database.execute(update_query)

        # Fetch the updated comment
        updated_comment = await database.fetch_one(comments.select().where(comments.c.id == comment_id))

        return CommentResponse(
            id=updated_comment["id"],
            thread_id=updated_comment["thread_id"],
            parent_id=updated_comment["parent_id"],
            text=updated_comment["text"],
            flags=updated_comment["flags"],
            approvals=updated_comment["approvals"],
            model_name=updated_comment["model_name"]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Error overwriting comment {comment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to overwrite comment.")


from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import asyncio
import logging

@router.post("/threads/{thread_id}/generate-response", response_model=CommentResponse)
async def generate_response(
    thread_id: int,
    request: GenerateResponseRequest,
    request_comment_id: Optional[int] = Query(None, alias="request_comment_id"),
    parent_comment_id: int = Query(..., alias="parent_comment_id")
): 
    """
    Generate an AI response for a specific thread or comment, utilizing summarization to manage context length.
    """
    try:
        # Verify that the thread exists
        thread_query = threads.select().where(threads.c.id == thread_id)
        thread = await database.fetch_one(thread_query)
        if not thread:
            logging.error(f"Thread with id {thread_id} not found.")
            raise HTTPException(status_code=404, detail="Thread not found.")

        # Check that parent_comment_id is provided
        if parent_comment_id is None:
            raise HTTPException(status_code=400, detail="parent_comment_id is required.")

        # Fetch the comment chain
        comment_chain = await fetch_comment_chain(parent_comment_id, thread_id)
        if not comment_chain:
            logging.error(f"Comment chain ending in id {parent_comment_id} not found in thread {thread_id}.")
            raise HTTPException(status_code=404, detail="Parent comment not found.")

        # Summarize the prompt
        summarized_prompt = summarize_text_chain(comment_chain)

        # Generate AI response
        loop = asyncio.get_event_loop()
        logging.info(f"Summarized Prompt is: {summarized_prompt}")
        response_text = await loop.run_in_executor(
            None, get_response, summarized_prompt, request.model_type, request.model_name
        )
        if not response_text.strip():
            logging.error("AI response is empty.")
            raise HTTPException(status_code=500, detail="AI response generation failed.")

        if request_comment_id:
            # Overwrite the placeholder comment
            update_query = comments.update().where(comments.c.id == request_comment_id).values(
                text=response_text,
                flags=1,  # Indicating AI-generated
                model_name=request.model_name
            )
            await database.execute(update_query)

            # Fetch the updated comment
            updated_comment = await database.fetch_one(
                comments.select().where(comments.c.id == request_comment_id)
            )

            return CommentResponse(
                id=updated_comment["id"],
                thread_id=updated_comment["thread_id"],
                parent_id=updated_comment["parent_id"],
                text=updated_comment["text"],
                flags=updated_comment["flags"],
                approvals=updated_comment["approvals"],
                model_name=updated_comment["model_name"],
                hidden=updated_comment["hidden"],
                            )
        else:
            # Create a new comment
            insert_query = comments.insert().values(
                thread_id=thread_id,
                parent_id=parent_comment_id,
                text=response_text,
                flags=1,  # Indicates AI-generated comment
                approvals=0,
                model_name=request.model_name,
                hidden=False
            )
            ai_comment_id = await database.execute(insert_query)

            # Fetch the new comment
            ai_comment = await database.fetch_one(comments.select().where(comments.c.id == ai_comment_id))

            return CommentResponse(
                id=ai_comment["id"],
                thread_id=ai_comment["thread_id"],
                parent_id=ai_comment["parent_id"],
                text=ai_comment["text"],
                flags=ai_comment["flags"],
                approvals=ai_comment["approvals"],
                model_name=ai_comment.get("model_name"),
                hidden=ai_comment.get("hidden", False)
            )

    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Error generating AI response for thread {thread_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate AI response.")


async def fetch_comment_chain(comment_id: int, thread_id: int):
    """
    Recursively fetches the entire chain of comments leading to the given comment_id.
    """
    comment_chain = []
    current_comment_id = comment_id

    while current_comment_id:
        query = comments.select().where(
            comments.c.id == current_comment_id,
            comments.c.thread_id == thread_id
        )
        comment = await database.fetch_one(query)
        if not comment:
            break

        # Insert at the beginning to maintain chronological order
        comment_chain.insert(0, comment)
        current_comment_id = comment["parent_id"]

    return comment_chain


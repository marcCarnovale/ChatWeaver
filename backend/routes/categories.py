# backend/routes/categories.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.database import database, categories, threads, comments
import logging
import uuid  # Import UUID for generating unique thread IDs
from backend.models import *

router = APIRouter()

# ----------------------------
# Route Definitions
# ----------------------------

@router.post("/categories", response_model=CategoryResponse)
async def create_category(request: CategoryCreateRequest):
    """
    Create a new category.
    """
    try:
        query = categories.insert().values(
            name=request.name,
            description=request.description
        )
        category_id = await database.execute(query)
        return CategoryResponse(id=category_id, name=request.name, description=request.description)
    except Exception as e:
        logging.error(f"Error creating category: {e}")
        raise HTTPException(status_code=400, detail="Category creation failed. Ensure the name is unique.")


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """
    Retrieve all categories.
    """
    try:
        query = categories.select()
        rows = await database.fetch_all(query)
        return [CategoryResponse(id=row["id"], name=row["name"], description=row["description"]) for row in rows]
    except Exception as e:
        logging.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve categories.")

@router.post("/threads", response_model=ThreadResponse)
async def create_thread(request: ThreadCreateRequest):
    try:
        # Insert into the threads table
        insert_thread_query = threads.insert().values(
            title=request.title,  # Ensure 'title' is used
            description=request.description,
            category_id=request.category_id,
            root_comment_id=None
        )
        thread_id = await database.execute(insert_thread_query)

        # Create the root-level comment for the thread
        root_comment_query = comments.insert().values(
            thread_id=thread_id,
            parent_id=None,
            text="Root Comment",
            flags=0,
            approvals=0
        )
        root_comment_id = await database.execute(root_comment_query)

        # Update the thread with the root comment ID
        update_thread_query = threads.update().where(threads.c.id == thread_id).values(
            root_comment_id=root_comment_id
        )
        await database.execute(update_thread_query)

        return ThreadResponse(
            id=thread_id,
            title=request.title,
            description=request.description,
            category_id=request.category_id,
            root_comment_id=root_comment_id
        )
    except Exception as e:
        logging.error(f"Error creating thread: {e}")
        raise HTTPException(status_code=400, detail="Thread creation failed.")



@router.get("/categories/{category_id}/threads", response_model=List[ThreadResponse])
async def get_threads(category_id: int):
    try:
        query = threads.select().where(threads.c.category_id == category_id)
        rows = await database.fetch_all(query)

        threads_list = [
            ThreadResponse(
                id=row["id"],
                title=row["title"],
                description=row["description"],
                category_id=row["category_id"],
                root_comment_id=row["root_comment_id"]
            )
            for row in rows
        ]

        return threads_list
    except Exception as e:
        logging.error(f"Error fetching threads: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve threads.")

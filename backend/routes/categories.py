# backend/routes/categories.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.database import database, categories, contexts, comments
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
    """
    Create a new thread within a category, including its root comment.
    """
    try:
        # Step 1: Generate a unique thread_id
        thread_id = str(uuid.uuid4())

        # Step 2: Insert the thread into the contexts table
        query = contexts.insert().values(
            thread_id=thread_id,
            category_id=request.category_id,
            parent_id=None,  # Top-level thread
            text=request.description or "Thread initiated.",
            flags=0,
            approvals=0
        )
        context_id = await database.execute(query)

        # Step 3: Create the root-level comment for the thread
        root_comment_query = comments.insert().values(
            thread_id=thread_id,
            parent_id=None,
            text="Root Comment",
            flags=0,
            approvals=0
        )
        root_comment_id = await database.execute(root_comment_query)

        # Step 4: Update the thread with the root comment ID
        update_query = contexts.update().where(contexts.c.id == context_id).values(
            root_comment_id=root_comment_id
        )
        await database.execute(update_query)

        # Step 5: Return the thread response
        return ThreadResponse(
            thread_id=thread_id,
            name=request.name,
            category_id=request.category_id,
            description=request.description,
            root_comment_id=root_comment_id
        )
    except Exception as e:
        logging.error(f"Error creating thread: {e}")
        raise HTTPException(status_code=420, detail=str(e))#"Thread creation failed. Ensure the category exists.")


@router.get("/categories/{category_id}/threads", response_model=List[ThreadResponse])
async def get_threads(category_id: int):
    """
    Retrieve all threads within a specific category.
    """
    try:
        logging.info(f"Fetching threads for category_id: {category_id}")

        # Verify that the category exists
        category_query = categories.select().where(categories.c.id == category_id)
        category = await database.fetch_one(category_query)
        if not category:
            logging.error(f"Category with id {category_id} does not exist.")
            raise HTTPException(status_code=404, detail="Category not found.")

        # Fetch threads where parent_id is None (top-level threads)
        query = contexts.select().where(
            contexts.c.category_id == category_id,
            contexts.c.parent_id == None
        )
        rows = await database.fetch_all(query)

        logging.info(f"Found {len(rows)} threads for category_id: {category_id}")

        threads = [
            ThreadResponse(
                thread_id=row["thread_id"],
                name=row["text"],
                category_id=row["category_id"],
                description=None  # Adjust if you have a description field
            )
            for row in rows
        ]

        logging.info(f"Returning {len(threads)} ThreadResponse items.")
        return threads
    except HTTPException as he:
        raise he  # Re-raise HTTP exceptions to be handled by FastAPI
    except Exception as e:
        logging.error(f"Error fetching threads for category {category_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve threads.")
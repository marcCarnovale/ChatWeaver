# backend/routes/comments.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.database import database, comments
import logging

router = APIRouter()

class CommentActionRequest(BaseModel):
    action: str  # 'hide' or 'delete'

@router.post("/comments/{comment_id}/action")
async def comment_action(comment_id: int, request: CommentActionRequest):
    """
    Perform an action on a comment: hide or delete.
    """
    if request.action not in ["hide", "delete"]:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'hide' or 'delete'.")
    
    try:
        # Check if comment exists
        comment_query = comments.select().where(comments.c.id == comment_id)
        comment = await database.fetch_one(comment_query)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found.")
        
        if request.action == "hide":
            # Update the 'hidden' flag
            update_query = comments.update().where(comments.c.id == comment_id).values(hidden=1)
            await database.execute(update_query)
            return {"message": "Comment hidden successfully."}
        
        elif request.action == "delete":
            # Permanently delete the comment
            delete_query = comments.delete().where(comments.c.id == comment_id)
            await database.execute(delete_query)
            return {"message": "Comment deleted successfully."}
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Error performing action on comment {comment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to perform action on comment.")

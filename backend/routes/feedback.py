"""
Feedback API Routes

This module defines the API endpoints for logging and retrieving feedback on contexts.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.feedback_service import log_feedback, get_feedback_summary

router = APIRouter()

class FeedbackRequest(BaseModel):
    context_id: str
    action: str  # 'flag' or 'approve'

@router.post("/context-feedback")
async def context_feedback(feedback_request: FeedbackRequest):
    """
    Log feedback (flag or approve) for a retrieved context.
    
    Args:
        feedback_request (FeedbackRequest): Feedback details.
    
    Returns:
        dict: Confirmation message.
    """
    if feedback_request.action not in ["flag", "approve"]:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'flag' or 'approve'.")
    
    success = await log_feedback(feedback_request.context_id, feedback_request.action)
    if success:
        return {"message": f"Context {feedback_request.context_id} {feedback_request.action} successfully."}
    else:
        raise HTTPException(status_code=500, detail="Failed to log feedback.")
    

@router.get("/feedback-summary")
async def feedback_summary():
    """
    Get aggregated feedback metrics.
    
    Returns:
        dict: Total flags and approvals.
    """
    summary = await get_feedback_summary()
    return summary

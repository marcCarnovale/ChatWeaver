"""
Feedback API Routes

This module defines the API endpoints for logging and retrieving feedback on threads.
"""

from fastapi import APIRouter, HTTPException

from backend.models import FeedbackRequest
from backend.services.feedback_service import get_feedback_summary, log_feedback

router = APIRouter()


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
        raise HTTPException(
            status_code=400,
            detail="Invalid action. Must be 'flag' or 'approve'.",
        )
    
    success = await log_feedback(feedback_request.context_id, feedback_request.action)
    if success:
        past_tense = {"flag": "flagged", "approve": "approved"}
        return {
            "message": (
                f"Context {feedback_request.context_id} "
                f"{past_tense[feedback_request.action]} successfully."
            )
        }
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

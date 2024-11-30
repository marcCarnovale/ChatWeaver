"""
Feedback Service

This module contains the business logic for logging and retrieving feedback on contexts.
"""

from ..database import database
from ..database.__init__ import feedback

async def log_feedback(context_id: str, action: str) -> bool:
    """
    Log user feedback by incrementing flags or approvals.
    
    Args:
        context_id (str): Unique identifier for the context.
        action (str): 'flag' or 'approve'.
    
    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        # Check if feedback record exists
        record = await database.fetch_one(
            query=feedback.select().where(feedback.c.context_id == context_id)
        )
        
        if record:
            if action == "flag":
                new_flags = record["flags"] + 1
                await database.execute(
                    feedback.update().where(feedback.c.context_id == context_id).values(flags=new_flags)
                )
            elif action == "approve":
                new_approvals = record["approvals"] + 1
                await database.execute(
                    feedback.update().where(feedback.c.context_id == context_id).values(approvals=new_approvals)
                )
        else:
            # Insert new feedback record
            if action == "flag":
                await database.execute(
                    feedback.insert().values(context_id=context_id, flags=1, approvals=0)
                )
            elif action == "approve":
                await database.execute(
                    feedback.insert().values(context_id=context_id, flags=0, approvals=1)
                )
        return True
    except Exception as e:
        print(f"Error logging feedback: {e}")
        return False

async def get_feedback_summary() -> dict:
    """
    Retrieve aggregated feedback metrics.
    
    Returns:
        dict: Total flags and approvals.
    """
    try:
        total_flags = await database.fetch_val("SELECT SUM(flags) FROM feedback")
        total_approvals = await database.fetch_val("SELECT SUM(approvals) FROM feedback")
        return {
            "total_flags": total_flags if total_flags else 0,
            "total_approvals": total_approvals if total_approvals else 0
        }
    except Exception as e:
        print(f"Error fetching feedback summary: {e}")
        return {"total_flags": 0, "total_approvals": 0}

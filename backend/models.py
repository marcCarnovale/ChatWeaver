# backend/models.py

from pydantic import BaseModel, Field
from typing import List, Optional

class ThreadResponse(BaseModel):
    thread_id: str
    name: str
    category_id: int
    description: Optional[str] = None
    root_comment_id: int

    class Config:
        orm_mode = True

class CommentResponse(BaseModel):
    id: int
    thread_id: str
    parent_id: Optional[int]
    text: str
    flags: int
    approvals: int
    model_name: Optional[str] = None
    replies: List['CommentResponse'] = Field(default_factory=list)

    class Config:
        orm_mode = True



class CategoryCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

class ThreadCreateRequest(BaseModel):
    name: str
    category_id: int
    description: Optional[str] = None


class CommentCreateRequest(BaseModel):
    parent_id: int | None = None  # Allows None or int
    text: str



class CommentActionRequest(BaseModel):
    action: str  # 'hide' or 'delete'





class RetrieveContextRequest(BaseModel):
    query: str
    min_approvals: int = 0
    hide_flagged: bool = False
    k: int = 5

class GenerateResponseRequest(BaseModel):
    query: str
    model_type: str = "openai"  # 'openai' or 'local'
    model_name: str = "gpt-4"  # e.g., 'gpt-4', 'gpt-3.5-turbo'
    parent_id: Optional[str] = None  # Updated to Optional to handle None

class CreateCommentRequest(BaseModel):
    thread_id: str
    parent_id: Optional[int] = None  # None for top-level comments
    text: str




class FeedbackRequest(BaseModel):
    context_id: str
    action: str  # 'flag' or 'approve'
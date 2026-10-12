"""
Pydantic schemas for Task domain.
"""

import uuid
from datetime import datetime, date

from pydantic import BaseModel, Field

from app.models.task import TaskPriority, TaskStatus


# ── Request Schemas ──────────────────────────────────────

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    due_date: date | None = None
    category: str | None = Field(None, max_length=100)


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    due_date: date | None = None
    category: str | None = None
    sort_order: int | None = None


# ── Response Schemas ─────────────────────────────────────

class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    priority: TaskPriority
    status: TaskStatus
    due_date: date | None
    category: str | None
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Query Filters ────────────────────────────────────────

class TaskFilter(BaseModel):
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    category: str | None = None

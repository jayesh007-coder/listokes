"""
Pydantic schemas for Expense domain.
"""

import uuid
from datetime import datetime, date

from pydantic import BaseModel, Field

from app.models.expense import ExpenseCategory


# ── Request Schemas ──────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = Field("USD", min_length=3, max_length=3)
    category: ExpenseCategory = ExpenseCategory.OTHER
    description: str | None = None
    merchant: str | None = Field(None, max_length=255)
    expense_date: date | None = None


class ExpenseUpdate(BaseModel):
    amount: float | None = Field(None, gt=0)
    currency: str | None = Field(None, min_length=3, max_length=3)
    category: ExpenseCategory | None = None
    description: str | None = None
    merchant: str | None = None
    expense_date: date | None = None


# ── Response Schemas ─────────────────────────────────────

class ExpenseResponse(BaseModel):
    id: uuid.UUID
    amount: float
    currency: str
    category: ExpenseCategory
    description: str | None
    merchant: str | None
    expense_date: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseSummary(BaseModel):
    """Monthly / category summary for analytics."""
    total: float
    currency: str
    category: ExpenseCategory | None = None
    count: int

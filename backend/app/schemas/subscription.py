"""
Pydantic schemas for Subscription domain.
"""

import uuid
from datetime import datetime, date

from pydantic import BaseModel

from app.models.subscription import SubscriptionPlan, SubscriptionStatus


# ── Request Schemas ──────────────────────────────────────

class SubscriptionCreate(BaseModel):
    plan: SubscriptionPlan = SubscriptionPlan.FREE
    payment_provider: str | None = None
    external_subscription_id: str | None = None


class SubscriptionUpdate(BaseModel):
    plan: SubscriptionPlan | None = None
    status: SubscriptionStatus | None = None
    expires_at: date | None = None
    payment_provider: str | None = None
    external_subscription_id: str | None = None


# ── Response Schemas ─────────────────────────────────────

class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    plan: SubscriptionPlan
    status: SubscriptionStatus
    started_at: date
    expires_at: date | None
    payment_provider: str | None
    external_subscription_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

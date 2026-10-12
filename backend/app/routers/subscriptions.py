"""
Subscription management router.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import SubscriptionResponse, SubscriptionUpdate

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get(
    "/me",
    response_model=SubscriptionResponse,
    summary="Get current user's subscription",
)
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.owner_id == current_user.id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found",
        )
    return sub


@router.patch(
    "/me",
    response_model=SubscriptionResponse,
    summary="Update / upgrade subscription",
)
async def update_my_subscription(
    body: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.owner_id == current_user.id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found",
        )

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(sub, field, value)
    await db.flush()
    return sub


@router.post(
    "/me/cancel",
    response_model=SubscriptionResponse,
    summary="Cancel the current subscription",
)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.owner_id == current_user.id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found",
        )

    from app.models.subscription import SubscriptionStatus
    sub.status = SubscriptionStatus.CANCELLED
    await db.flush()
    return sub

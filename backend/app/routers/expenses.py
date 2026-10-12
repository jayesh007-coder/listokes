"""
Expense tracking router — CRUD + monthly summary.
"""

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.expense import Expense, ExpenseCategory
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseSummary, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post(
    "/",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a new expense",
)
async def create_expense(
    body: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = body.model_dump()
    if data.get("expense_date") is None:
        data["expense_date"] = datetime.now(timezone.utc).date()
    expense = Expense(owner_id=current_user.id, **data)
    db.add(expense)
    await db.flush()
    return expense


@router.get("/", response_model=list[ExpenseResponse], summary="List expenses")
async def list_expenses(
    category: ExpenseCategory | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Expense).where(Expense.owner_id == current_user.id)

    if category:
        query = query.where(Expense.category == category)
    if start_date:
        query = query.where(Expense.expense_date >= start_date)
    if end_date:
        query = query.where(Expense.expense_date <= end_date)

    query = query.order_by(Expense.expense_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get(
    "/summary",
    response_model=list[ExpenseSummary],
    summary="Get expense summary by category for a given month",
)
async def expense_summary(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(
            Expense.category,
            Expense.currency,
            func.sum(Expense.amount).label("total"),
            func.count().label("count"),
        )
        .where(
            Expense.owner_id == current_user.id,
            extract("year", Expense.expense_date) == year,
            extract("month", Expense.expense_date) == month,
        )
        .group_by(Expense.category, Expense.currency)
    )
    result = await db.execute(query)
    rows = result.all()
    return [
        ExpenseSummary(
            category=row.category,
            currency=row.currency,
            total=float(row.total),
            count=row.count,
        )
        for row in rows
    ]


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
    summary="Get a specific expense",
)
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_owned_expense(expense_id, current_user, db)


@router.patch(
    "/{expense_id}",
    response_model=ExpenseResponse,
    summary="Update an expense",
)
async def update_expense(
    expense_id: str,
    body: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = await _get_owned_expense(expense_id, current_user, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    await db.flush()
    return expense


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an expense",
)
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = await _get_owned_expense(expense_id, current_user, db)
    await db.delete(expense)
    await db.flush()


# ── Helpers ──────────────────────────────────────────────

async def _get_owned_expense(
    expense_id: str, user: User, db: AsyncSession
) -> Expense:
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.owner_id == user.id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
        )
    return expense

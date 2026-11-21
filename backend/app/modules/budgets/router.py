import datetime as dt

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.modules.accounts.router import SessionDep, UserDep
from app.modules.budgets import service
from app.modules.budgets.models import EXCLUDABLE

router = APIRouter(prefix="/v1", tags=["budgets"])


class PeriodOut(BaseModel):
    start: dt.date
    end: dt.date
    limit_cents: int | None
    spent_cents: int
    remaining_cents: int | None


class BudgetOut(BaseModel):
    # False until the user saves budgets for the first time (Home asks them to set one).
    configured: bool
    style: service.Style | None
    weekly_cents: int | None
    monthly_cents: int | None
    excluded_categories: list[str]
    excludable_categories: list[str]
    week: PeriodOut
    month: PeriodOut


class BudgetIn(BaseModel):
    style: service.Style
    weekly_cents: int | None = Field(default=None, gt=0)
    monthly_cents: int | None = Field(default=None, gt=0)
    excluded_categories: list[str] = []


def _period(p: service.PeriodStatus) -> PeriodOut:
    return PeriodOut(
        start=p.start,
        end=p.end,
        limit_cents=p.limit_cents,
        spent_cents=p.spent_cents,
        remaining_cents=p.remaining_cents,
    )


def _out(s: service.BudgetStatus) -> BudgetOut:
    b = s.budget
    return BudgetOut(
        configured=b is not None,
        style=b.style if b else None,
        weekly_cents=b.weekly_cents if b else None,
        monthly_cents=b.monthly_cents if b else None,
        excluded_categories=list(b.excluded_categories) if b else [],
        excludable_categories=list(EXCLUDABLE),
        week=_period(s.week),
        month=_period(s.month),
    )


@router.get("/budget")
def get_budget(user: UserDep, session: SessionDep) -> BudgetOut:
    return _out(service.status(session, user))


@router.put("/budget")
def put_budget(body: BudgetIn, user: UserDep, session: SessionDep) -> BudgetOut:
    try:
        service.save(
            session,
            user,
            body.style,
            body.weekly_cents,
            body.monthly_cents,
            body.excluded_categories,
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    return _out(service.status(session, user))

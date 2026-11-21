"""Budgets (PRD F5): weekly and monthly limits against discretionary spend."""

import calendar
import datetime as dt
from dataclasses import dataclass
from typing import Literal

from sqlalchemy.orm import Session

from app.modules.accounts.service import discretionary_spend, local_today, week_start
from app.modules.budgets.models import EXCLUDABLE, Budget
from app.modules.identity.models import User

Style = Literal["weekly", "monthly", "none"]


@dataclass(frozen=True)
class PeriodStatus:
    start: dt.date
    end: dt.date  # inclusive, the last day of the week or month
    limit_cents: int | None
    spent_cents: int

    @property
    def remaining_cents(self) -> int | None:
        """Negative when over the limit; None when no limit is set."""
        return None if self.limit_cents is None else self.limit_cents - self.spent_cents


@dataclass(frozen=True)
class BudgetStatus:
    budget: Budget | None
    week: PeriodStatus
    month: PeriodStatus


def week_window(today: dt.date) -> tuple[dt.date, dt.date]:
    start = week_start(today)
    return start, start + dt.timedelta(days=6)


def month_window(today: dt.date) -> tuple[dt.date, dt.date]:
    last = calendar.monthrange(today.year, today.month)[1]
    return today.replace(day=1), today.replace(day=last)


def status(session: Session, user: User, today: dt.date | None = None) -> BudgetStatus:
    """Both budgets with what's been spent so far (spend counts up to today)."""
    today = today or local_today(user)
    budget = session.get(Budget, user.id)
    week_start_, week_end = week_window(today)
    month_start, month_end = month_window(today)
    return BudgetStatus(
        budget=budget,
        week=PeriodStatus(
            week_start_,
            week_end,
            budget.weekly_cents if budget else None,
            discretionary_spend(session, user, week_start_, today),
        ),
        month=PeriodStatus(
            month_start,
            month_end,
            budget.monthly_cents if budget else None,
            discretionary_spend(session, user, month_start, today),
        ),
    )


def save(
    session: Session,
    user: User,
    style: Style,
    weekly_cents: int | None,
    monthly_cents: int | None,
    excluded_categories: list[str],
) -> Budget:
    """Create or replace the user's budgets. Raises ValueError on an invalid combination."""
    unknown = set(excluded_categories) - set(EXCLUDABLE)
    if unknown:
        raise ValueError(f"unknown categories: {sorted(unknown)}")
    if style == "weekly" and weekly_cents is None:
        raise ValueError("a weekly budget needs a weekly limit")
    if style == "monthly" and monthly_cents is None:
        raise ValueError("a monthly budget needs a monthly limit")

    budget = session.get(Budget, user.id)
    if budget is None:
        budget = Budget(user_id=user.id)
        session.add(budget)
    budget.style = style
    budget.weekly_cents = weekly_cents
    budget.monthly_cents = monthly_cents
    # Keep the catalog order so the list reads the same everywhere.
    budget.excluded_categories = [c for c in EXCLUDABLE if c in set(excluded_categories)]
    session.flush()
    return budget

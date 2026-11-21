import uuid

from sqlalchemy import BigInteger, ForeignKey, String, select
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.core.db import Base, TimestampMixin

# Categories that never count against a budget (PRD F5: rent, card payments, transfers).
ALWAYS_EXCLUDED = frozenset(
    {"INCOME", "TRANSFER_IN", "TRANSFER_OUT", "LOAN_PAYMENTS", "RENT_AND_UTILITIES"}
)

# Plaid personal finance categories (primary) the user may also leave out.
EXCLUDABLE = (
    "FOOD_AND_DRINK",
    "GENERAL_MERCHANDISE",
    "TRAVEL",
    "TRANSPORTATION",
    "ENTERTAINMENT",
    "PERSONAL_CARE",
    "GENERAL_SERVICES",
    "HOME_IMPROVEMENT",
    "MEDICAL",
    "GOVERNMENT_AND_NON_PROFIT",
    "BANK_FEES",
)


class Budget(TimestampMixin, Base):
    """One user's budgets: which one Home leads with, both limits, and extra exclusions.

    style is "weekly", "monthly" or "none" (just show what I spend). A limit of None means
    it hasn't been set. No row at all means the user hasn't set up budgets yet.
    """

    __tablename__ = "budgets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    style: Mapped[str] = mapped_column(String(16), nullable=False)
    weekly_cents: Mapped[int | None] = mapped_column(BigInteger)
    monthly_cents: Mapped[int | None] = mapped_column(BigInteger)
    excluded_categories: Mapped[list[str]] = mapped_column(
        ARRAY(String(64)), nullable=False, default=list
    )


def excluded_categories(session: Session, user_id: uuid.UUID) -> frozenset[str]:
    """Every category that doesn't count against this user's budgets.

    Lives with the model (not the service) so spending in the accounts module can read it
    without importing the budgets service, which itself reads spending.
    """
    extra = session.scalar(select(Budget.excluded_categories).where(Budget.user_id == user_id))
    return ALWAYS_EXCLUDED | frozenset(extra or ())

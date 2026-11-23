import datetime as dt
import uuid

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    SmallInteger,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TimestampMixin


class CardAssignment(TimestampMixin, Base):
    """Which catalog card a linked credit account is.

    `source` is "guess" when Porter matched it from the account name and "user" once picked or
    confirmed. A user row with no card_id means "not in the catalog", so it isn't re-guessed.
    """

    __tablename__ = "card_assignments"

    account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    card_id: Mapped[str | None] = mapped_column(String(64))
    anniversary_month: Mapped[int | None] = mapped_column(SmallInteger)
    source: Mapped[str] = mapped_column(String(16), nullable=False)


class BenefitPeriod(TimestampMixin, Base):
    """One credit on one card for one window, e.g. Gold dining credit, November 2026."""

    __tablename__ = "benefit_periods"
    __table_args__ = (UniqueConstraint("account_id", "card_id", "credit_id", "start_date"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False
    )
    card_id: Mapped[str] = mapped_column(String(64), nullable=False)
    credit_id: Mapped[str] = mapped_column(String(64), nullable=False)
    start_date: Mapped[dt.date] = mapped_column(Date, nullable=False)
    end_date: Mapped[dt.date] = mapped_column(Date, nullable=False)
    amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    used_cents: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    # An issuer statement credit was seen (rather than only a qualifying purchase).
    confirmed: Mapped[bool] = mapped_column(nullable=False, default=False)
    marked_used_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class BenefitMatch(TimestampMixin, Base):
    """A transaction the rules matched to a period. Kept as labelled data for later models."""

    __tablename__ = "benefit_matches"
    __table_args__ = (UniqueConstraint("period_id", "transaction_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    period_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("benefit_periods.id", ondelete="CASCADE"), index=True, nullable=False
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # "issuer_credit" | "purchase"
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)

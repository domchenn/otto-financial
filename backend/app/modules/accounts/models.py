import datetime as dt
import uuid

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TimestampMixin


class Connection(TimestampMixin, Base):
    """One login at one institution (a Plaid Item)."""

    __tablename__ = "connections"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="plaid")
    provider_item_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    access_token_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    institution_id: Mapped[str | None] = mapped_column(String(64))
    institution_name: Mapped[str | None] = mapped_column(String(128))
    # "ok" or "needs_reauth"
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ok")
    error_code: Mapped[str | None] = mapped_column(String(64))
    transactions_cursor: Mapped[str | None] = mapped_column(Text)
    last_synced_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class Account(TimestampMixin, Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    connection_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("connections.id", ondelete="CASCADE"), index=True, nullable=False
    )
    provider_account_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    official_name: Mapped[str | None] = mapped_column(String(256))
    mask: Mapped[str | None] = mapped_column(String(8))
    # depository | credit | loan | investment | other
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    subtype: Mapped[str | None] = mapped_column(String(64))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    # For credit accounts current_cents is the amount owed (positive).
    current_cents: Mapped[int | None] = mapped_column(BigInteger)
    available_cents: Mapped[int | None] = mapped_column(BigInteger)
    limit_cents: Mapped[int | None] = mapped_column(BigInteger)
    statement_balance_cents: Mapped[int | None] = mapped_column(BigInteger)
    minimum_due_cents: Mapped[int | None] = mapped_column(BigInteger)
    next_due_date: Mapped[dt.date | None] = mapped_column(Date)
    last_payment_cents: Mapped[int | None] = mapped_column(BigInteger)
    last_payment_date: Mapped[dt.date | None] = mapped_column(Date)
    balances_updated_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class Transaction(TimestampMixin, Base):
    __tablename__ = "transactions"
    __table_args__ = (Index("ix_transactions_user_id_date", "user_id", "date"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True, nullable=False
    )
    provider_transaction_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    # Positive = money out (a purchase); negative = money in (refund, payment, deposit).
    amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    date: Mapped[dt.date] = mapped_column(Date, nullable=False)
    authorized_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    merchant_name: Mapped[str | None] = mapped_column(String(256))
    category: Mapped[str | None] = mapped_column(String(64))
    pending: Mapped[bool] = mapped_column(nullable=False, default=False)


class NetWorthSnapshot(TimestampMixin, Base):
    """One row per user per day, rewritten on every sync that day (for history charts)."""

    __tablename__ = "net_worth_snapshots"
    __table_args__ = (UniqueConstraint("user_id", "date"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[dt.date] = mapped_column(Date, nullable=False)
    assets_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    liabilities_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)

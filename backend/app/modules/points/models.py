import datetime as dt
import uuid

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TimestampMixin


class PointsBalance(TimestampMixin, Base):
    """The last balance the user confirmed for one points program (PRD F3).

    No API exposes points balances, so this is entered by hand (source "manual"); emails
    can update it later. Otto's estimate adds what was earned after confirmed_at.
    """

    __tablename__ = "points_balances"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    program_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    points: Mapped[int] = mapped_column(BigInteger, nullable=False)
    confirmed_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False)

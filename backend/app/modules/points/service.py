"""Points balances (PRD F3): the last confirmed balance plus an estimate of what's been earned.

No API exposes points balances, so the user confirms each program's balance by hand. Porter
then adds the points earned on posted purchases from that day on, using each card's earn
rates. Issuers add points at statement close, so the estimate runs ahead of the issuer's
number mid-cycle; confirming again resets it.
"""

import datetime as dt
from dataclasses import dataclass
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.accounts.models import Account, Transaction
from app.modules.benefits.catalog import CardProduct, Program, get_catalog
from app.modules.benefits.service import assigned_cards
from app.modules.identity.models import User
from app.modules.points.earning import Purchase, points_for
from app.modules.points.models import PointsBalance


@dataclass(frozen=True)
class ProgramView:
    program: Program
    cards: list[tuple[Account, CardProduct]]
    balance: PointsBalance | None
    earned_since: int  # 0 until a balance is confirmed

    @property
    def estimated_points(self) -> int | None:
        """None until the user confirms a balance: Porter doesn't guess a starting point."""
        return None if self.balance is None else self.balance.points + self.earned_since


@dataclass(frozen=True)
class PointsView:
    programs: list[ProgramView]

    @property
    def total_points(self) -> int:
        return sum(p.estimated_points or 0 for p in self.programs)

    @property
    def confirmed_count(self) -> int:
        return sum(1 for p in self.programs if p.balance is not None)


def _confirmed_on(user: User, balance: PointsBalance) -> dt.date:
    return balance.confirmed_at.astimezone(ZoneInfo(user.timezone)).date()


def _earned(session: Session, cards: list[tuple[Account, CardProduct]], since: dt.date) -> int:
    total = 0
    for account, card in cards:
        assert card.points is not None
        rows = session.scalars(
            select(Transaction).where(
                Transaction.account_id == account.id,
                Transaction.date >= since,
                Transaction.pending.is_(False),
            )
        ).all()
        for t in rows:
            purchase = Purchase(
                t.amount_cents, t.date, t.name, t.merchant_name, t.category, t.category_detailed
            )
            total += points_for(card.points, purchase)
    return total


def status(session: Session, user: User) -> PointsView:
    """Every program the user's cards earn into, plus any with a balance already saved."""
    catalog = get_catalog()
    by_program: dict[str, list[tuple[Account, CardProduct]]] = {}
    for account, card in assigned_cards(session, user):
        if card is not None and card.points is not None:
            by_program.setdefault(card.points.program, []).append((account, card))
    balances = {
        b.program_id: b
        for b in session.scalars(select(PointsBalance).where(PointsBalance.user_id == user.id))
    }

    views: list[ProgramView] = []
    for program in catalog.programs:
        cards = by_program.get(program.id, [])
        balance = balances.get(program.id)
        if not cards and balance is None:
            continue
        earned = _earned(session, cards, _confirmed_on(user, balance)) if balance else 0
        views.append(ProgramView(program, cards, balance, earned))
    # Confirmed programs first, biggest balance first; the rest keep catalog order.
    views.sort(key=lambda v: (v.estimated_points is None, -(v.estimated_points or 0)))
    return PointsView(views)


def confirm(
    session: Session, user: User, program_id: str, points: int, now: dt.datetime | None = None
) -> None:
    """Save the balance the user sees in the issuer's app, as of now."""
    if get_catalog().program(program_id) is None:
        raise LookupError(program_id)
    now = now or dt.datetime.now(dt.UTC)
    balance = session.get(PointsBalance, (user.id, program_id))
    if balance is None:
        balance = PointsBalance(user_id=user.id, program_id=program_id)
        session.add(balance)
    balance.points = points
    balance.confirmed_at = now
    balance.source = "manual"
    session.flush()
